"""
Django Admin конфигурация для модуля архива.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count

from .models import (
    RetentionPolicy, ArchiveCategory, ArchivedDocument, 
    ArchiveActivity, AIAnalysisResult, ArchivePermission,
    AutoArchivingRule, ArchivingJob, ComplianceRule,
    DocumentEmbedding, ArchiveAnalytics
)


@admin.register(RetentionPolicy)
class RetentionPolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'retention_period', 'period_type', 'auto_delete', 'created_at']
    list_filter = ['auto_delete', 'period_type', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ArchiveCategory)
class ArchiveCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'default_access_level', 'retention_policy', 'is_active', 'document_count']
    list_filter = ['default_access_level', 'is_active', 'retention_policy']
    search_fields = ['name', 'description']
    readonly_fields = ['full_path', 'created_at', 'updated_at']
    
    def document_count(self, obj):
        return obj.documents.count()
    document_count.short_description = 'Количество документов'


@admin.register(ArchivedDocument)
class ArchivedDocumentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'category', 'archived_by', 'status', 'access_level', 'archived_at', 'size']
    list_filter = ['status', 'access_level', 'category', 'archived_at']
    search_fields = ['original_file__name', 'tags', 'archive_note']
    readonly_fields = ['archived_at', 'updated_at', 'checksum', 'version']
    date_hierarchy = 'archived_at'
    
    def file_name(self, obj):
        return obj.original_file.name
    file_name.short_description = 'Имя файла'
    
    def size(self, obj):
        return f"{obj.original_file.size / 1024:.1f} KB"
    size.short_description = 'Размер'
    
    actions = ['mark_as_expired', 'restore_documents']
    
    def mark_as_expired(self, request, queryset):
        count = queryset.update(status='expired')
        self.message_user(request, f'{count} документов помечено как истекшие.')
    mark_as_expired.short_description = 'Пометить как истекшие'
    
    def restore_documents(self, request, queryset):
        count = queryset.update(status='archived')
        self.message_user(request, f'{count} документов восстановлено.')
    restore_documents.short_description = 'Восстановить документы'


@admin.register(ArchiveActivity)
class ArchiveActivityAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'user', 'activity_type', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['document__original_file__name', 'user__username', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def document_name(self, obj):
        return obj.document.original_file.name if obj.document else 'N/A'
    document_name.short_description = 'Документ'


@admin.register(AIAnalysisResult)
class AIAnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'analysis_type', 'ai_model', 'confidence_score', 'created_at']
    list_filter = ['analysis_type', 'ai_model', 'created_at']
    search_fields = ['document__original_file__name', 'summary']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def document_name(self, obj):
        return obj.document.original_file.name
    document_name.short_description = 'Документ'


@admin.register(ArchivePermission)
class ArchivePermissionAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'user', 'permission_type', 'granted_by', 'expires_at', 'granted_at']
    list_filter = ['permission_type', 'expires_at', 'granted_at']
    search_fields = ['document__original_file__name', 'user__username']
    readonly_fields = ['granted_at']
    
    def document_name(self, obj):
        return obj.document.original_file.name
    document_name.short_description = 'Документ'


@admin.register(AutoArchivingRule)
class AutoArchivingRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'trigger_type', 'target_category', 'status', 'schedule_enabled', 'last_run', 'next_run']
    list_filter = ['trigger_type', 'status', 'schedule_enabled', 'target_category']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'last_run']
    
    actions = ['enable_rules', 'disable_rules']
    
    def enable_rules(self, request, queryset):
        count = queryset.update(status='active')
        self.message_user(request, f'{count} правил активировано.')
    enable_rules.short_description = 'Активировать правила'
    
    def disable_rules(self, request, queryset):
        count = queryset.update(status='disabled')
        self.message_user(request, f'{count} правил деактивировано.')
    disable_rules.short_description = 'Деактивировать правила'


@admin.register(ArchivingJob)
class ArchivingJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'job_type', 'status', 'created_by', 'total_files', 'processed_files', 'failed_files', 'created_at']
    list_filter = ['job_type', 'status', 'created_at']
    search_fields = ['id', 'created_by__username']
    readonly_fields = ['id', 'created_at', 'completed_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by', 'auto_rule')


@admin.register(ComplianceRule)
class ComplianceRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'rule_type', 'is_active', 'effective_date', 'created_at']
    list_filter = ['rule_type', 'is_active', 'effective_date']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DocumentEmbedding)
class DocumentEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'embedding_model', 'embedding_version', 'keyword_count', 'created_at']
    list_filter = ['embedding_model', 'embedding_version', 'created_at']
    search_fields = ['document__original_file__name', 'keywords']
    readonly_fields = ['created_at']
    
    def document_name(self, obj):
        return obj.document.original_file.name
    document_name.short_description = 'Документ'
    
    def keyword_count(self, obj):
        return len(obj.keywords) if obj.keywords else 0
    keyword_count.short_description = 'Ключевых слов'


@admin.register(ArchiveAnalytics)
class ArchiveAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'metric_date', 'category', 'total_count', 'total_size_mb', 'created_at']
    list_filter = ['metric_type', 'metric_date', 'category']
    readonly_fields = ['created_at']
    date_hierarchy = 'metric_date'
    
    def total_size_mb(self, obj):
        return f"{obj.total_size / 1024 / 1024:.1f} MB" if obj.total_size else "0 MB"
    total_size_mb.short_description = 'Размер (MB)'


# Кастомизация Django Admin для лучшего UX
admin.site.site_header = 'Система управления архивом документов'
admin.site.site_title = 'Archive Admin'
admin.site.index_title = 'Управление архивом'
