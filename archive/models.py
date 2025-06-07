import os
import hashlib
import json
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import uuid


class RetentionPolicy(models.Model):
    """Политики хранения документов"""
    
    PERIOD_CHOICES = [
        ('days', 'Дни'),
        ('months', 'Месяцы'),
        ('years', 'Годы'),
        ('permanent', 'Постоянно'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    retention_period = models.IntegerField(help_text="Период хранения")
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    auto_delete = models.BooleanField(default=False, help_text="Автоматическое удаление по истечении срока")
    notification_days = models.IntegerField(default=30, help_text="За сколько дней уведомлять о истечении срока")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Политика хранения"
        verbose_name_plural = "Политики хранения"
    
    def __str__(self):
        return f"{self.name} ({self.retention_period} {self.get_period_type_display()})"
    
    def calculate_retention_date(self, start_date=None):
        """Вычисляет дату окончания хранения"""
        if not start_date:
            start_date = timezone.now()
        
        if self.period_type == 'permanent':
            return None
        elif self.period_type == 'days':
            return start_date + timezone.timedelta(days=self.retention_period)
        elif self.period_type == 'months':
            return start_date + timezone.timedelta(days=self.retention_period * 30)
        elif self.period_type == 'years':
            return start_date + timezone.timedelta(days=self.retention_period * 365)
        
        return None


class ArchiveCategory(models.Model):
    """Категории архивных документов"""
    
    ACCESS_LEVELS = [
        ('public', 'Публичный'),
        ('internal', 'Внутренний'),
        ('confidential', 'Конфиденциальный'),
        ('restricted', 'Ограниченный'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    
    # Правила автоматической категоризации
    auto_rules = models.JSONField(
        default=dict, 
        blank=True,
        help_text="JSON правила для автоматической категоризации"
    )
    
    # Политика хранения для этой категории
    retention_policy = models.ForeignKey(
        RetentionPolicy, 
        on_delete=models.PROTECT,
        help_text="Политика хранения документов в этой категории"
    )
    
    # Схема метаданных для документов в категории
    metadata_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON схема для метаданных документов"
    )
    
    # Уровень доступа по умолчанию
    default_access_level = models.CharField(
        max_length=20, 
        choices=ACCESS_LEVELS, 
        default='internal'
    )
    
    # Настройки для этой категории
    is_active = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False, help_text="Требует одобрения для архивирования")
    auto_categorize = models.BooleanField(default=True, help_text="Включить автокатегоризацию")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_categories')
    
    class Meta:
        ordering = ['parent__name', 'name']
        verbose_name = "Категория архива"
        verbose_name_plural = "Категории архива"
        indexes = [
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} / {self.name}"
        return self.name
    
    @property
    def full_path(self):
        """Полный путь категории"""
        if self.parent:
            return f"{self.parent.full_path} / {self.name}"
        return self.name
    
    def get_all_children(self):
        """Получить все дочерние категории рекурсивно"""
        children = list(self.subcategories.filter(is_active=True))
        for child in list(children):
            children.extend(child.get_all_children())
        return children


class ArchivedDocument(models.Model):
    """Архивированные документы"""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает архивирования'),
        ('processing', 'Обрабатывается'),
        ('archived', 'Архивирован'),
        ('expired', 'Срок хранения истек'),
        ('scheduled_deletion', 'Запланировано удаление'),
        ('deleted', 'Удален'),
    ]
    
    ACCESS_LEVELS = [
        ('public', 'Публичный'),
        ('internal', 'Внутренний'),
        ('confidential', 'Конфиденциальный'),
        ('restricted', 'Ограниченный'),
    ]
    
    # Связь с оригинальным файлом
    original_file = models.OneToOneField(
        'filemanager.FileItem', 
        on_delete=models.CASCADE,
        related_name='archive_record'
    )
    
    # Категория архива
    category = models.ForeignKey(
        ArchiveCategory, 
        on_delete=models.PROTECT,
        related_name='documents'
    )
    
    # Информация об архивировании
    archived_at = models.DateTimeField(auto_now_add=True)
    archived_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='archived_documents')
    
    # Статус и доступ
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVELS, default='internal')
    
    # Метаданные документа
    metadata = models.JSONField(default=dict, blank=True)
    ai_analysis = models.JSONField(default=dict, blank=True, help_text="Результаты ИИ анализа")
    tags = models.JSONField(default=list, blank=True)
    
    # Управление жизненным циклом
    retention_date = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)
    
    # Версионирование
    version = models.IntegerField(default=1)
    checksum = models.CharField(max_length=64, help_text="SHA-256 checksum")
    
    # Комментарии и заметки
    archive_note = models.TextField(blank=True, help_text="Заметка при архивировании")
    admin_notes = models.TextField(blank=True, help_text="Административные заметки")
    
    # Временные метки
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-archived_at']
        verbose_name = "Архивированный документ"
        verbose_name_plural = "Архивированные документы"
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['archived_by', 'archived_at']),
            models.Index(fields=['status', 'retention_date']),
            models.Index(fields=['access_level']),
            models.Index(fields=['checksum']),
        ]
    
    def __str__(self):
        return f"Archive: {self.original_file.name} ({self.category.name})"
    
    def save(self, *args, **kwargs):
        # Автоматический расчет даты окончания хранения
        if not self.retention_date and self.category.retention_policy:
            self.retention_date = self.category.retention_policy.calculate_retention_date(
                self.archived_at or timezone.now()
            )
        
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Проверяет, истек ли срок хранения"""
        if not self.retention_date:
            return False
        return timezone.now() > self.retention_date
    
    @property
    def days_until_expiry(self):
        """Количество дней до истечения срока хранения"""
        if not self.retention_date:
            return None
        delta = self.retention_date - timezone.now()
        return delta.days if delta.days > 0 else 0
    
    def update_access_info(self):
        """Обновляет информацию о доступе"""
        self.last_accessed = timezone.now()
        self.access_count += 1
        self.save(update_fields=['last_accessed', 'access_count'])


class ArchivePermission(models.Model):
    """Права доступа к архивным документам"""
    
    PERMISSION_TYPES = [
        ('view', 'Просмотр'),
        ('download', 'Скачивание'),
        ('restore', 'Восстановление'),
        ('delete', 'Удаление'),
        ('admin', 'Администрирование'),
    ]
    
    document = models.ForeignKey(ArchivedDocument, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES)
    
    granted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='granted_archive_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['document', 'user', 'permission_type']
        verbose_name = "Права доступа к архиву"
        verbose_name_plural = "Права доступа к архиву"
    
    def __str__(self):
        return f"{self.user.username} - {self.get_permission_type_display()} - {self.document}"


class ArchiveActivity(models.Model):
    """Журнал активности в архиве"""
    
    ACTIVITY_TYPES = [
        ('archived', 'Архивирован'),
        ('viewed', 'Просмотрен'),
        ('downloaded', 'Скачан'),
        ('restored', 'Восстановлен'),
        ('category_changed', 'Изменена категория'),
        ('metadata_updated', 'Обновлены метаданные'),
        ('permission_granted', 'Предоставлены права'),
        ('permission_revoked', 'Отозваны права'),
        ('expired', 'Истек срок хранения'),
        ('deleted', 'Удален'),
    ]
    
    document = models.ForeignKey(ArchivedDocument, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Информация о запросе
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Активность в архиве"
        verbose_name_plural = "Активность в архиве"
        indexes = [
            models.Index(fields=['document', 'activity_type']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.get_activity_type_display()} {self.document.original_file.name}"


class ComplianceRule(models.Model):
    """Правила соответствия нормативным требованиям"""
    
    RULE_TYPES = [
        ('gdpr', 'GDPR'),
        ('sox', 'SOX'),
        ('hipaa', 'HIPAA'),
        ('custom', 'Пользовательское'),
    ]
    
    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES)
    description = models.TextField()
    
    # Категории, к которым применяется правило
    categories = models.ManyToManyField(ArchiveCategory, related_name='compliance_rules')
    
    # Настройки правила
    required_retention_period = models.IntegerField(null=True, blank=True)
    max_retention_period = models.IntegerField(null=True, blank=True)
    requires_encryption = models.BooleanField(default=False)
    requires_audit_log = models.BooleanField(default=True)
    auto_delete_required = models.BooleanField(default=False)
    
    # Метаданные правила
    regulation_reference = models.CharField(max_length=200, blank=True)
    effective_date = models.DateField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Правило соответствия"
        verbose_name_plural = "Правила соответствия"
    
    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"


class DocumentEmbedding(models.Model):
    """Векторные представления документов для ИИ поиска"""
    
    document = models.OneToOneField(
        ArchivedDocument, 
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    
    # Векторное представление контента
    content_embedding = models.JSONField(
        help_text="Векторное представление содержимого документа"
    )
    
    # Векторное представление метаданных
    metadata_embedding = models.JSONField(
        help_text="Векторное представление метаданных",
        null=True, blank=True
    )
    
    # Информация о модели ИИ
    embedding_model = models.CharField(
        max_length=100, 
        default='sentence-transformers/all-MiniLM-L6-v2'
    )
    embedding_version = models.CharField(max_length=20, default='1.0')
    
    # Извлеченные ключевые слова и темы
    keywords = models.JSONField(default=list, blank=True)
    topics = models.JSONField(default=list, blank=True)
    
    # Семантические связи с другими документами
    similarity_score = models.FloatField(null=True, blank=True)
    related_documents = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Векторное представление документа"
        verbose_name_plural = "Векторные представления документов"
        indexes = [
            models.Index(fields=['embedding_model', 'embedding_version']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Embedding: {self.document.original_file.name}"


class AIAnalysisResult(models.Model):
    """Результаты ИИ анализа документов"""
    
    ANALYSIS_TYPES = [
        ('content_classification', 'Классификация контента'),
        ('sentiment_analysis', 'Анализ тональности'),
        ('entity_extraction', 'Извлечение сущностей'),
        ('topic_modeling', 'Моделирование тем'),
        ('similarity_analysis', 'Анализ похожести'),
        ('compliance_check', 'Проверка соответствия'),
        ('quality_assessment', 'Оценка качества'),
    ]
    
    document = models.ForeignKey(
        ArchivedDocument, 
        on_delete=models.CASCADE,
        related_name='ai_analyses'
    )
    
    analysis_type = models.CharField(max_length=30, choices=ANALYSIS_TYPES)
    ai_model = models.CharField(max_length=100, help_text="Используемая модель ИИ")
    
    # Результаты анализа
    results = models.JSONField(help_text="Структурированные результаты анализа")
    confidence_score = models.FloatField(help_text="Уровень уверенности (0-1)")
    
    # Извлеченная информация
    extracted_entities = models.JSONField(default=list, blank=True)
    classifications = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True, help_text="Краткое описание результатов")
    
    # Рекомендации
    recommendations = models.JSONField(default=list, blank=True)
    suggested_category = models.ForeignKey(
        ArchiveCategory, 
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_suggested_documents'
    )
    suggested_tags = models.JSONField(default=list, blank=True)
    
    processing_time = models.FloatField(help_text="Время обработки в секундах")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Результат ИИ анализа"
        verbose_name_plural = "Результаты ИИ анализа"
        indexes = [
            models.Index(fields=['document', 'analysis_type']),
            models.Index(fields=['ai_model', 'created_at']),
            models.Index(fields=['confidence_score']),
        ]
    
    def __str__(self):
        return f"AI Analysis: {self.document.original_file.name} - {self.get_analysis_type_display()}"


class AutoArchivingRule(models.Model):
    """Правила автоматического архивирования"""
    
    TRIGGER_TYPES = [
        ('time_based', 'По времени'),
        ('size_based', 'По размеру'),
        ('pattern_based', 'По шаблону'),
        ('ai_classification', 'По ИИ классификации'),
        ('user_activity', 'По активности пользователя'),
        ('storage_threshold', 'По заполнению хранилища'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Активно'),
        ('paused', 'Приостановлено'),
        ('disabled', 'Отключено'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Тип триггера и условия
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES)
    trigger_conditions = models.JSONField(
        help_text="JSON конфигурация условий срабатывания"
    )
    
    # Действия при срабатывании
    target_category = models.ForeignKey(
        ArchiveCategory, 
        on_delete=models.CASCADE,
        help_text="Целевая категория для архивирования"
    )
    
    # Фильтры файлов
    file_patterns = models.JSONField(
        default=list, 
        blank=True,
        help_text="Шаблоны имен файлов для обработки"
    )
    exclude_patterns = models.JSONField(
        default=list, 
        blank=True,
        help_text="Шаблоны исключений"
    )
    
    # Настройки обработки
    require_ai_analysis = models.BooleanField(default=True)
    auto_approve = models.BooleanField(default=False)
    preserve_original = models.BooleanField(default=True)
    
    # Расписание выполнения
    schedule_enabled = models.BooleanField(default=True)
    schedule_cron = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Cron выражение для расписания"
    )
    
    # Статус и статистика
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Правило автоархивирования"
        verbose_name_plural = "Правила автоархивирования"
        indexes = [
            models.Index(fields=['status', 'schedule_enabled']),
            models.Index(fields=['trigger_type']),
            models.Index(fields=['next_run']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_trigger_type_display()})"


class ArchivingJob(models.Model):
    """Задания архивирования"""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('running', 'Выполняется'),
        ('completed', 'Завершено'),
        ('failed', 'Ошибка'),
        ('cancelled', 'Отменено'),
    ]
    
    JOB_TYPES = [
        ('manual', 'Ручное'),
        ('scheduled', 'По расписанию'),
        ('auto_rule', 'Автоправило'),
        ('bulk_import', 'Массовый импорт'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Связь с правилом (если применимо)
    auto_rule = models.ForeignKey(
        AutoArchivingRule, 
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='jobs'
    )
    
    job_type = models.CharField(max_length=20, choices=JOB_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Параметры задания
    source_paths = models.JSONField(help_text="Пути к обрабатываемым файлам")
    target_category = models.ForeignKey(ArchiveCategory, on_delete=models.CASCADE)
    
    # Настройки обработки
    configuration = models.JSONField(default=dict, blank=True)
    
    # Прогресс выполнения
    total_files = models.IntegerField(default=0)
    processed_files = models.IntegerField(default=0)
    successful_files = models.IntegerField(default=0)
    failed_files = models.IntegerField(default=0)
    
    # Результаты
    results = models.JSONField(default=dict, blank=True)
    error_log = models.JSONField(default=list, blank=True)
    
    # Временные метки
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Задание архивирования"
        verbose_name_plural = "Задания архивирования"
        indexes = [
            models.Index(fields=['status', 'job_type']),
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['auto_rule', 'status']),
        ]
    
    def __str__(self):
        return f"Job {self.id} - {self.get_status_display()}"
    
    @property
    def progress_percentage(self):
        """Процент выполнения"""
        if self.total_files == 0:
            return 0
        return (self.processed_files / self.total_files) * 100
    
    def update_progress(self, processed=0, successful=0, failed=0):
        """Обновление прогресса выполнения"""
        self.processed_files += processed
        self.successful_files += successful
        self.failed_files += failed
        self.save(update_fields=['processed_files', 'successful_files', 'failed_files'])


class ArchiveAnalytics(models.Model):
    """Аналитические данные архива"""
    
    METRIC_TYPES = [
        ('storage_usage', 'Использование хранилища'),
        ('archive_rate', 'Скорость архивирования'),
        ('access_frequency', 'Частота доступа'),
        ('category_distribution', 'Распределение по категориям'),
        ('retention_compliance', 'Соблюдение сроков хранения'),
        ('ai_accuracy', 'Точность ИИ'),
        ('user_activity', 'Активность пользователей'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    metric_date = models.DateField()
    
    # Данные метрики
    metric_data = models.JSONField(help_text="Структурированные данные метрики")
    
    # Агрегированные значения
    total_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
    average_value = models.FloatField(null=True, blank=True)
    
    # Категоризация
    category = models.ForeignKey(
        ArchiveCategory, 
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['metric_type', 'metric_date', 'category']
        ordering = ['-metric_date', 'metric_type']
        verbose_name = "Аналитика архива"
        verbose_name_plural = "Аналитика архива"
        indexes = [
            models.Index(fields=['metric_type', 'metric_date']),
            models.Index(fields=['category', 'metric_date']),
        ]
    
    def __str__(self):
        category_str = f" ({self.category.name})" if self.category else ""
        return f"{self.get_metric_type_display()} - {self.metric_date}{category_str}"
