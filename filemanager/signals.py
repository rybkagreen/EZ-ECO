from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
from .models import FileItem
from .services.filesystem import FileSystemService
import os

@receiver(pre_delete, sender=FileItem)
def delete_file_from_filesystem(sender, instance, **kwargs):
    """Удаляет файл из файловой системы при удалении записи FileItem"""
    if not instance.is_directory:
        fs_service = FileSystemService()
        try:
            fs_service.delete_item(instance.full_path)
        except OSError:
            pass  # Файл уже может быть удален

@receiver(post_save, sender=FileItem)
def create_directory_if_needed(sender, instance, created, **kwargs):
    """Создает директорию в файловой системе при создании записи о директории"""
    if created and instance.is_directory:
        fs_service = FileSystemService()
        fs_service.create_directory(instance.full_path)
