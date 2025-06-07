import os
import mimetypes
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.conf import settings
from django.utils import timezone
import uuid


def upload_to_user_directory(instance, filename):
    """Загрузка файлов в директорию пользователя"""
    return f'user_{instance.owner.id}/{uuid.uuid4()}/{filename}'


class FileItem(models.Model):
    """Модель для представления файлов и папок"""
    
    FILE_TYPES = [
        ('file', 'File'),
        ('directory', 'Directory'),
        ('symlink', 'Symlink'),
    ]
    
    # Основная информация
    name = models.CharField(max_length=255)
    path = models.TextField()  # Полный путь к файлу
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='file')
    
    # Файловые атрибуты
    size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    encoding = models.CharField(max_length=50, blank=True, null=True)
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accessed_at = models.DateTimeField(default=timezone.now)
    modified_at = models.DateTimeField(null=True, blank=True)
    
    # Владение и права доступа
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_files')
    is_public = models.BooleanField(default=False)
    is_shared = models.BooleanField(default=False)
    
    # Файл (для загруженных файлов)
    file = models.FileField(upload_to=upload_to_user_directory, blank=True, null=True)
    
    # Родительская директория
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    
    # Метаданные
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Статус
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['file_type', 'name']
        indexes = [
            models.Index(fields=['owner', 'is_deleted']),
            models.Index(fields=['parent', 'file_type']),
            models.Index(fields=['path']),
            models.Index(fields=['mime_type']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['path', 'owner'],
                name='unique_path_per_user'
            )
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Автоматически определяем MIME тип
        if self.file and not self.mime_type:
            self.mime_type, self.encoding = mimetypes.guess_type(self.file.name)
        elif not self.mime_type and self.name:
            self.mime_type, self.encoding = mimetypes.guess_type(self.name)
        
        # Устанавливаем размер файла
        if self.file and not self.size:
            self.size = self.file.size
        
        super().save(*args, **kwargs)
    
    @property
    def extension(self):
        """Возвращает расширение файла"""
        return os.path.splitext(self.name)[1].lower()
    
    @property
    def is_image(self):
        """Проверяет, является ли файл изображением"""
        return self.mime_type and self.mime_type.startswith('image/')
    
    @property
    def is_text(self):
        """Проверяет, является ли файл текстовым"""
        return self.mime_type and (
            self.mime_type.startswith('text/') or
            self.mime_type in ['application/json', 'application/xml']
        )
    
    @property
    def is_code(self):
        """Проверяет, является ли файл кодом"""
        code_extensions = ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.php', '.rb', '.go']
        return self.extension in code_extensions
    
    def get_absolute_path(self):
        """Возвращает абсолютный путь к файлу"""
        if self.file:
            return self.file.path
        return os.path.join(settings.MEDIA_ROOT, self.path)
    
    def has_read_permission(self, user):
        """Проверяет права на чтение"""
        return (
            self.owner == user or
            self.is_public or
            FilePermission.objects.filter(
                file_item=self,
                user=user,
                permission_type__in=['read', 'write', 'admin']
            ).exists()
        )
    
    def has_write_permission(self, user):
        """Проверяет права на запись"""
        return (
            self.owner == user or
            FilePermission.objects.filter(
                file_item=self,
                user=user,
                permission_type__in=['write', 'admin']
            ).exists()
        )


class FilePermission(models.Model):
    """Права доступа к файлам"""
    
    PERMISSION_TYPES = [
        ('read', 'Read'),
        ('write', 'Write'),
        ('admin', 'Admin'),
    ]
    
    file_item = models.ForeignKey(FileItem, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES)
    granted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='granted_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['file_item', 'user', 'permission_type']
        indexes = [
            models.Index(fields=['file_item', 'user']),
            models.Index(fields=['user', 'permission_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.permission_type} on {self.file_item.name}"
    
    @property
    def is_expired(self):
        """Проверяет, истекли ли права доступа"""
        return self.expires_at and self.expires_at < timezone.now()


class FileVersion(models.Model):
    """Версии файлов"""
    
    file_item = models.ForeignKey(FileItem, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    file = models.FileField(upload_to=upload_to_user_directory)
    size = models.BigIntegerField()
    checksum = models.CharField(max_length=64)  # SHA-256
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['file_item', 'version_number']
        indexes = [
            models.Index(fields=['file_item', 'version_number']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.file_item.name} v{self.version_number}"


class FileShare(models.Model):
    """Общий доступ к файлам"""
    
    file_item = models.ForeignKey(FileItem, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files')
    share_token = models.UUIDField(default=uuid.uuid4, unique=True)
    
    is_public = models.BooleanField(default=False)
    allow_download = models.BooleanField(default=True)
    allow_upload = models.BooleanField(default=False)
    
    password = models.CharField(max_length=255, blank=True, null=True)
    max_downloads = models.IntegerField(null=True, blank=True)
    download_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['share_token']),
            models.Index(fields=['shared_by', 'is_active']),
        ]
    
    def __str__(self):
        return f"Share: {self.file_item.name} by {self.shared_by.username}"
    
    @property
    def is_expired(self):
        """Проверяет, истекла ли ссылка"""
        return self.expires_at and self.expires_at < timezone.now()
    
    @property
    def is_download_limit_reached(self):
        """Проверяет, достигнут ли лимит загрузок"""
        return self.max_downloads and self.download_count >= self.max_downloads


class FileActivity(models.Model):
    """Журнал активности файлов"""
    
    ACTIVITY_TYPES = [
        ('created', 'Created'),
        ('uploaded', 'Uploaded'),
        ('downloaded', 'Downloaded'),
        ('viewed', 'Viewed'),
        ('modified', 'Modified'),
        ('deleted', 'Deleted'),
        ('shared', 'Shared'),
        ('renamed', 'Renamed'),
        ('moved', 'Moved'),
    ]
    
    file_item = models.ForeignKey(FileItem, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['file_item', 'activity_type']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.activity_type} {self.file_item.name}"
