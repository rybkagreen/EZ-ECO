from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ArchivedDocument, ArchiveCategory, ArchiveActivity,
    AutoArchivingRule, ArchivingJob, DocumentEmbedding,
    AIAnalysisResult, ArchiveAnalytics, RetentionPolicy,
    ArchivePermission, ComplianceRule
)
from filemanager.models import FileItem


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователя"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class RetentionPolicySerializer(serializers.ModelSerializer):
    """Сериализатор для политик хранения"""
    class Meta:
        model = RetentionPolicy
        fields = (
            'id', 'name', 'description', 'default_retention_days',
            'max_retention_days', 'auto_delete_expired', 'created_at'
        )
        read_only_fields = ('created_at',)


class ArchiveCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий архива"""
    created_by = UserSerializer(read_only=True)
    retention_policy = RetentionPolicySerializer(read_only=True)
    full_path = serializers.ReadOnlyField()
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ArchiveCategory
        fields = (
            'id', 'name', 'description', 'parent', 'auto_rules',
            'retention_policy', 'metadata_schema', 'default_access_level',
            'is_active', 'requires_approval', 'auto_categorize',
            'created_by', 'created_at', 'updated_at', 'full_path',
            'documents_count'
        )
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def get_documents_count(self, obj):
        return obj.documents.count()


class ArchiveCategoryCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания категорий"""
    class Meta:
        model = ArchiveCategory
        fields = (
            'name', 'description', 'parent', 'auto_rules',
            'retention_policy', 'metadata_schema', 'default_access_level',
            'requires_approval', 'auto_categorize'
        )
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ArchivedDocumentSerializer(serializers.ModelSerializer):
    """Сериализатор для архивированных документов"""
    category = ArchiveCategorySerializer(read_only=True)
    archived_by = UserSerializer(read_only=True)
    original_file_name = serializers.CharField(source='original_file.name', read_only=True)
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    
    class Meta:
        model = ArchivedDocument
        fields = (
            'id', 'original_file', 'category', 'archived_by', 'status',
            'access_level', 'metadata', 'ai_analysis', 'tags',
            'retention_date', 'last_accessed', 'access_count',
            'version', 'checksum', 'archive_note', 'admin_notes',
            'archived_at', 'updated_at', 'original_file_name',
            'is_expired', 'days_until_expiry'
        )
        read_only_fields = ('archived_at', 'updated_at', 'archived_by', 'checksum')


class ArchivedDocumentCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания архивных документов"""
    class Meta:
        model = ArchivedDocument
        fields = (
            'original_file', 'category', 'access_level', 'metadata',
            'tags', 'archive_note'
        )
    
    def create(self, validated_data):
        validated_data['archived_by'] = self.context['request'].user
        return super().create(validated_data)


class ArchivePermissionSerializer(serializers.ModelSerializer):
    """Сериализатор для прав доступа к архиву"""
    user = UserSerializer(read_only=True)
    granted_by = UserSerializer(read_only=True)
    document_name = serializers.CharField(source='document.original_file.name', read_only=True)
    
    class Meta:
        model = ArchivePermission
        fields = (
            'id', 'document', 'user', 'permission_type', 'granted_by',
            'granted_at', 'expires_at', 'document_name'
        )
        read_only_fields = ('granted_at', 'granted_by')


class ArchiveActivitySerializer(serializers.ModelSerializer):
    """Сериализатор для активности в архиве"""
    user = UserSerializer(read_only=True)
    document_name = serializers.CharField(source='document.original_file.name', read_only=True)
    
    class Meta:
        model = ArchiveActivity
        fields = (
            'id', 'document', 'user', 'activity_type', 'description',
            'metadata', 'ip_address', 'user_agent', 'created_at',
            'document_name'
        )
        read_only_fields = ('created_at', 'user')


class DocumentEmbeddingSerializer(serializers.ModelSerializer):
    """Сериализатор для векторных представлений документов"""
    document_name = serializers.CharField(source='document.original_file.name', read_only=True)
    
    class Meta:
        model = DocumentEmbedding
        fields = (
            'id', 'document', 'embedding_model', 'embedding_version',
            'embedding_vector', 'vector_dimensions', 'metadata',
            'created_at', 'document_name'
        )
        read_only_fields = ('created_at',)


class AIAnalysisResultSerializer(serializers.ModelSerializer):
    """Сериализатор для результатов ИИ анализа"""
    document_name = serializers.CharField(source='document.original_file.name', read_only=True)
    
    class Meta:
        model = AIAnalysisResult
        fields = (
            'id', 'document', 'analysis_type', 'ai_model', 'result_data',
            'confidence_score', 'processing_time', 'metadata',
            'created_at', 'document_name'
        )
        read_only_fields = ('created_at',)


class AutoArchivingRuleSerializer(serializers.ModelSerializer):
    """Сериализатор для правил автоархивирования"""
    created_by = UserSerializer(read_only=True)
    target_category = ArchiveCategorySerializer(read_only=True)
    
    class Meta:
        model = AutoArchivingRule
        fields = (
            'id', 'name', 'description', 'trigger_type', 'trigger_config',
            'target_category', 'file_patterns', 'exclude_patterns',
            'require_ai_analysis', 'auto_approve', 'preserve_original',
            'schedule_enabled', 'schedule_cron', 'status', 'last_run',
            'next_run', 'success_count', 'error_count', 'created_by',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'last_run', 'success_count', 'error_count')


class AutoArchivingRuleCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания правил автоархивирования"""
    class Meta:
        model = AutoArchivingRule
        fields = (
            'name', 'description', 'trigger_type', 'trigger_config',
            'target_category', 'file_patterns', 'exclude_patterns',
            'require_ai_analysis', 'auto_approve', 'preserve_original',
            'schedule_enabled', 'schedule_cron'
        )
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ArchivingJobSerializer(serializers.ModelSerializer):
    """Сериализатор для заданий архивирования"""
    created_by = UserSerializer(read_only=True)
    auto_rule = AutoArchivingRuleSerializer(read_only=True)
    target_category = ArchiveCategorySerializer(read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ArchivingJob
        fields = (
            'id', 'auto_rule', 'job_type', 'status', 'source_paths',
            'target_category', 'configuration', 'total_files',
            'processed_files', 'successful_files', 'failed_files',
            'results', 'error_log', 'created_by', 'created_at',
            'started_at', 'completed_at', 'progress_percentage'
        )
        read_only_fields = (
            'created_at', 'started_at', 'completed_at', 'created_by',
            'processed_files', 'successful_files', 'failed_files'
        )


class ArchivingJobCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания заданий архивирования"""
    class Meta:
        model = ArchivingJob
        fields = (
            'job_type', 'source_paths', 'target_category', 'configuration'
        )
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ArchiveAnalyticsSerializer(serializers.ModelSerializer):
    """Сериализатор для аналитики архива"""
    category = ArchiveCategorySerializer(read_only=True)
    
    class Meta:
        model = ArchiveAnalytics
        fields = (
            'id', 'metric_type', 'metric_date', 'metric_data',
            'total_count', 'total_size', 'average_value', 'category',
            'created_at'
        )
        read_only_fields = ('created_at',)


class ComplianceRuleSerializer(serializers.ModelSerializer):
    """Сериализатор для правил соответствия"""
    class Meta:
        model = ComplianceRule
        fields = (
            'id', 'name', 'description', 'rule_type', 'rule_config',
            'severity', 'is_active', 'last_check', 'created_at'
        )
        read_only_fields = ('created_at', 'last_check')


# Упрощенные сериализаторы для списков
class ArchivedDocumentListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка документов"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    original_file_name = serializers.CharField(source='original_file.name', read_only=True)
    archived_by_username = serializers.CharField(source='archived_by.username', read_only=True)
    
    class Meta:
        model = ArchivedDocument
        fields = (
            'id', 'original_file_name', 'category_name', 'status',
            'access_level', 'archived_at', 'archived_by_username'
        )


class ArchiveCategoryListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка категорий"""
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ArchiveCategory
        fields = ('id', 'name', 'description', 'is_active', 'documents_count')
    
    def get_documents_count(self, obj):
        return obj.documents.count()


class ArchiveStatsSerializer(serializers.Serializer):
    """Сериализатор для статистики архива"""
    total_documents = serializers.IntegerField()
    total_size = serializers.IntegerField()
    categories_count = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    recent_activities = serializers.ListField()
    storage_usage = serializers.DictField()
    compliance_status = serializers.DictField()


class SemanticSearchSerializer(serializers.Serializer):
    """Сериализатор для семантического поиска"""
    query = serializers.CharField(max_length=500)
    limit = serializers.IntegerField(default=10, min_value=1, max_value=100)
    category_id = serializers.IntegerField(required=False)
    similarity_threshold = serializers.FloatField(default=0.7, min_value=0.0, max_value=1.0)


class AnalyticsReportSerializer(serializers.Serializer):
    """Сериализатор для аналитических отчетов"""
    report_type = serializers.ChoiceField(choices=[
        ('storage_usage', 'Использование хранилища'),
        ('access_patterns', 'Паттерны доступа'),
        ('category_distribution', 'Распределение по категориям'),
        ('compliance_report', 'Отчет о соответствии'),
        ('ai_analysis_summary', 'Сводка ИИ анализа'),
    ])
    date_from = serializers.DateField()
    date_to = serializers.DateField()
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    format = serializers.ChoiceField(
        choices=[('json', 'JSON'), ('csv', 'CSV'), ('pdf', 'PDF')],
        default='json'
    )
