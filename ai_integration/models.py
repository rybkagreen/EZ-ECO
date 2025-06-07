from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import json


class AIModel(models.Model):
    """Модель для представления AI моделей"""
    
    MODEL_TYPES = [
        ('text_analysis', 'Text Analysis'),
        ('image_analysis', 'Image Analysis'),
        ('document_analysis', 'Document Analysis'),
        ('code_analysis', 'Code Analysis'),
        ('translation', 'Translation'),
        ('summarization', 'Summarization'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    version = models.CharField(max_length=20, default='1.0')
    description = models.TextField(blank=True)
    endpoint_url = models.URLField(blank=True, null=True)
    api_key = models.CharField(max_length=255, blank=True, null=True)
    parameters = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_type', 'is_active']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.model_type})"


class AIAnalysis(models.Model):
    """Модель для хранения результатов AI анализа"""
    
    ANALYSIS_TYPES = [
        ('text', 'Text Analysis'),
        ('file_analysis', 'File Analysis'),
        ('image_analysis', 'Image Analysis'),
        ('batch_analysis', 'Batch Analysis'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_analyses')
    ai_model = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='analyses')
    file_item = models.ForeignKey('filemanager.FileItem', on_delete=models.CASCADE, null=True, blank=True)
    
    analysis_type = models.CharField(max_length=50, choices=ANALYSIS_TYPES)
    input_data = models.TextField()
    output_data = models.TextField(blank=True, null=True)
    result = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    
    processing_time = models.DurationField(null=True, blank=True)
    tokens_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['analysis_type', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.analysis_type} for {self.user.username} - {self.status}"
    
    @property
    def duration_seconds(self):
        """Возвращает длительность обработки в секундах"""
        if self.processing_time:
            return self.processing_time.total_seconds()
        return None


class AIPromptTemplate(models.Model):
    """Шаблоны промптов для AI"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    template = models.TextField()
    model_type = models.CharField(max_length=50, choices=AIModel.MODEL_TYPES)
    variables = models.JSONField(default=list, help_text="List of variable names used in template")
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['name', 'created_by']
    
    def __str__(self):
        return self.name
    
    def render_template(self, **kwargs):
        """Рендерит шаблон с предоставленными переменными"""
        try:
            return self.template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing variable: {e}")


class AIUsageStatistics(models.Model):
    """Статистика использования AI"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    
    total_requests = models.IntegerField(default=0)
    successful_requests = models.IntegerField(default=0)
    failed_requests = models.IntegerField(default=0)
    
    total_tokens = models.IntegerField(default=0)
    total_processing_time = models.DurationField(default=None, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"


class AIModelPerformance(models.Model):
    """Метрики производительности AI моделей"""
    
    ai_model = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='performance_metrics')
    date = models.DateField()
    
    total_requests = models.IntegerField(default=0)
    successful_requests = models.IntegerField(default=0)
    avg_response_time = models.DurationField(null=True, blank=True)
    avg_tokens_per_request = models.FloatField(default=0.0)
    
    error_rate = models.FloatField(default=0.0)  # Процент ошибок
    user_satisfaction = models.FloatField(null=True, blank=True)  # Рейтинг от пользователей
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['ai_model', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.ai_model.name} - {self.date}"
