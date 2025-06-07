from rest_framework import serializers
from filemanager.models import FileItem, FileVersion, FilePermission, FileShare, FileActivity
from ai_integration.models import AIModel, AIAnalysis, AIPromptTemplate, AIUsageStatistics
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели пользователя"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class FileItemSerializer(serializers.ModelSerializer):
    """Сериализатор для файловых элементов"""
    
    owner = UserSerializer(read_only=True)
    extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    is_text = serializers.ReadOnlyField()
    is_code = serializers.ReadOnlyField()
    
    class Meta:
        model = FileItem
        fields = (
            'id', 'name', 'path', 'file_type', 'mime_type', 'encoding', 'size',
            'created_at', 'updated_at', 'accessed_at', 'modified_at',
            'owner', 'parent', 'is_public', 'is_shared', 'tags', 'metadata',
            'extension', 'is_image', 'is_text', 'is_code'
        )
        read_only_fields = ('created_at', 'updated_at', 'owner', 'size', 'mime_type', 'encoding')
    
    def validate_name(self, value):
        """Валидация имени файла"""
        if not value or value.strip() == '':
            raise serializers.ValidationError("File name cannot be empty")
        
        # Проверка на запрещенные символы
        forbidden_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in forbidden_chars:
            if char in value:
                raise serializers.ValidationError(f"File name cannot contain '{char}'")
        
        return value.strip()


class FileItemCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания файловых элементов"""
    
    file = serializers.FileField(required=False)
    
    class Meta:
        model = FileItem
        fields = ('name', 'parent', 'file_type', 'file', 'tags', 'is_public')
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class FilePermissionSerializer(serializers.ModelSerializer):
    """Сериализатор для прав доступа к файлам"""
    
    user = UserSerializer(read_only=True)
    granted_by = UserSerializer(read_only=True)
    file_item = serializers.StringRelatedField(read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = FilePermission
        fields = (
            'id', 'file_item', 'user', 'permission_type', 'granted_by',
            'granted_at', 'expires_at', 'is_expired'
        )
        read_only_fields = ('granted_at', 'granted_by')


class FileVersionSerializer(serializers.ModelSerializer):
    """Сериализатор для версий файлов"""
    
    created_by = UserSerializer(read_only=True)
    file_item = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = FileVersion
        fields = (
            'id', 'file_item', 'version_number', 'file', 'size', 'checksum',
            'created_by', 'created_at', 'comment'
        )
        read_only_fields = ('created_at', 'created_by', 'size', 'checksum')


class FileShareSerializer(serializers.ModelSerializer):
    """Сериализатор для общего доступа к файлам"""
    
    shared_by = UserSerializer(read_only=True)
    file_item = FileItemSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    is_download_limit_reached = serializers.ReadOnlyField()
    
    class Meta:
        model = FileShare
        fields = (
            'id', 'file_item', 'shared_by', 'share_token', 'is_public',
            'allow_download', 'allow_upload', 'max_downloads', 'download_count',
            'created_at', 'expires_at', 'is_active', 'is_expired', 'is_download_limit_reached'
        )
        read_only_fields = ('created_at', 'shared_by', 'share_token', 'download_count')


class FileActivitySerializer(serializers.ModelSerializer):
    """Сериализатор для активности файлов"""
    
    user = UserSerializer(read_only=True)
    file_item = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = FileActivity
        fields = (
            'id', 'file_item', 'user', 'activity_type', 'description',
            'metadata', 'ip_address', 'user_agent', 'created_at'
        )
        read_only_fields = ('created_at',)


class AIModelSerializer(serializers.ModelSerializer):
    """Сериализатор для AI моделей"""
    
    class Meta:
        model = AIModel
        fields = (
            'id', 'name', 'model_type', 'version', 'description',
            'endpoint_url', 'parameters', 'is_active',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'api_key': {'write_only': True}  # Скрываем API ключ
        }


class AIAnalysisSerializer(serializers.ModelSerializer):
    """Сериализатор для анализа AI"""
    
    user = UserSerializer(read_only=True)
    ai_model = AIModelSerializer(read_only=True)
    file_item = FileItemSerializer(read_only=True)
    duration_seconds = serializers.ReadOnlyField()
    
    class Meta:
        model = AIAnalysis
        fields = (
            'id', 'user', 'ai_model', 'file_item', 'analysis_type',
            'input_data', 'output_data', 'result', 'status', 'error_message',
            'processing_time', 'duration_seconds', 'tokens_used',
            'created_at', 'updated_at', 'completed_at'
        )
        read_only_fields = (
            'created_at', 'updated_at', 'completed_at', 'processing_time',
            'tokens_used', 'user'
        )


class AIAnalysisCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания анализа AI"""
    
    ai_model_id = serializers.IntegerField()
    file_item_id = serializers.IntegerField(required=False)
    
    class Meta:
        model = AIAnalysis
        fields = (
            'ai_model_id', 'file_item_id', 'analysis_type', 'input_data'
        )
    
    def validate_ai_model_id(self, value):
        """Валидация AI модели"""
        try:
            ai_model = AIModel.objects.get(id=value, is_active=True)
        except AIModel.DoesNotExist:
            raise serializers.ValidationError("AI model not found or inactive")
        return value
    
    def validate_file_item_id(self, value):
        """Валидация файлового элемента"""
        if value:
            user = self.context['request'].user
            try:
                file_item = FileItem.objects.get(id=value)
                if not file_item.has_read_permission(user):
                    raise serializers.ValidationError("No permission to access this file")
            except FileItem.DoesNotExist:
                raise serializers.ValidationError("File not found")
        return value
    
    def create(self, validated_data):
        ai_model_id = validated_data.pop('ai_model_id')
        file_item_id = validated_data.pop('file_item_id', None)
        
        validated_data['user'] = self.context['request'].user
        validated_data['ai_model'] = AIModel.objects.get(id=ai_model_id)
        
        if file_item_id:
            validated_data['file_item'] = FileItem.objects.get(id=file_item_id)
        
        return super().create(validated_data)


class AIPromptTemplateSerializer(serializers.ModelSerializer):
    """Сериализатор для шаблонов промптов"""
    
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = AIPromptTemplate
        fields = (
            'id', 'name', 'description', 'template', 'model_type',
            'variables', 'is_public', 'created_by', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AIUsageStatisticsSerializer(serializers.ModelSerializer):
    """Сериализатор для статистики использования AI"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AIUsageStatistics
        fields = (
            'id', 'user', 'date', 'total_requests', 'successful_requests',
            'failed_requests', 'total_tokens', 'total_processing_time',
            'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')


# Упрощенные сериализаторы для списков
class FileItemListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка файлов"""
    
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = FileItem
        fields = (
            'id', 'name', 'file_type', 'mime_type', 'size',
            'created_at', 'updated_at', 'owner_username', 'is_public'
        )


class AIAnalysisListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка анализов"""
    
    ai_model_name = serializers.CharField(source='ai_model.name', read_only=True)
    file_name = serializers.CharField(source='file_item.name', read_only=True)
    
    class Meta:
        model = AIAnalysis
        fields = (
            'id', 'analysis_type', 'ai_model_name', 'file_name',
            'status', 'created_at', 'completed_at'
        )
    
    class Meta:
        model = FileVersion
        fields = ('id', 'file', 'version_number', 'created_at', 'created_by',
                 'size', 'hash', 'storage_path')
        read_only_fields = ('created_at', 'created_by', 'hash')

class FilePermissionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    granted_by = UserSerializer(read_only=True)
    
    class Meta:
        model = FilePermission
        fields = ('id', 'file', 'user', 'permission', 'granted_by', 'granted_at')
        read_only_fields = ('granted_at', 'granted_by')

class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = ('id', 'name', 'model_type', 'model_path', 'is_active',
                 'created_at', 'updated_at', 'configuration')
        read_only_fields = ('created_at', 'updated_at')

class AIAnalysisSerializer(serializers.ModelSerializer):
    file = FileItemSerializer(read_only=True)
    model = AIModelSerializer(read_only=True)
    requested_by = UserSerializer(read_only=True)
    
    class Meta:
        model = AIAnalysis
        fields = ('id', 'file', 'model', 'status', 'results', 'error_message',
                 'created_at', 'completed_at', 'requested_by')
        read_only_fields = ('created_at', 'completed_at', 'requested_by')
