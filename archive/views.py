from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.http import HttpResponse
import json
import csv
import logging

from .models import (
    ArchivedDocument, ArchiveCategory, ArchiveActivity,
    AutoArchivingRule, ArchivingJob, DocumentEmbedding,
    AIAnalysisResult, ArchiveAnalytics, RetentionPolicy,
    ArchivePermission, ComplianceRule
)
from .serializers import (
    ArchivedDocumentSerializer, ArchivedDocumentCreateSerializer, ArchivedDocumentListSerializer,
    ArchiveCategorySerializer, ArchiveCategoryCreateSerializer, ArchiveCategoryListSerializer,
    ArchiveActivitySerializer, AutoArchivingRuleSerializer, AutoArchivingRuleCreateSerializer,
    ArchivingJobSerializer, ArchivingJobCreateSerializer, DocumentEmbeddingSerializer,
    AIAnalysisResultSerializer, ArchiveAnalyticsSerializer, RetentionPolicySerializer,
    ArchivePermissionSerializer, ComplianceRuleSerializer, ArchiveStatsSerializer,
    SemanticSearchSerializer, AnalyticsReportSerializer
)
from .services import AutoArchivingService, ArchiveSearchService, ArchiveAnalyticsService

logger = logging.getLogger(__name__)


class ArchivedDocumentViewSet(viewsets.ModelViewSet):
    """API для работы с архивированными документами"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ArchivedDocumentCreateSerializer
        elif self.action == 'list':
            return ArchivedDocumentListSerializer
        return ArchivedDocumentSerializer
    
    def get_queryset(self):
        queryset = ArchivedDocument.objects.select_related(
            'category', 'archived_by', 'original_file'
        ).prefetch_related('activities', 'permissions')
        
        # Фильтры
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        access_level = self.request.query_params.get('access_level')
        if access_level:
            queryset = queryset.filter(access_level=access_level)
        
        # Поиск по имени файла
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(original_file__name__icontains=search) |
                Q(tags__icontains=search) |
                Q(metadata__icontains=search)
            )
        
        return queryset.order_by('-archived_at')
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановление документа из архива"""
        document = self.get_object()
        
        try:
            # Здесь будет логика восстановления
            # Пока просто меняем статус
            document.status = 'archived'
            document.save()
            
            # Логируем активность
            ArchiveActivity.objects.create(
                document=document,
                user=request.user,
                activity_type='restored',
                description=f"Документ восстановлен пользователем {request.user.username}"
            )
            
            return Response({'status': 'Document restored successfully'})
            
        except Exception as e:
            logger.error(f"Error restoring document {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to restore document'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Скачивание архивного документа"""
        document = self.get_object()
        
        # Проверяем права доступа
        if not self._has_download_permission(request.user, document):
            return Response(
                {'error': 'No permission to download this document'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Обновляем информацию о доступе
        document.update_access_info()
        
        # Логируем активность
        ArchiveActivity.objects.create(
            document=document,
            user=request.user,
            activity_type='downloaded',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Возвращаем URL для скачивания
        return Response({
            'download_url': document.original_file.file.url if document.original_file.file else None,
            'filename': document.original_file.name,
            'size': document.original_file.size
        })
    
    @action(detail=True, methods=['post'])
    def update_metadata(self, request, pk=None):
        """Обновление метаданных документа"""
        document = self.get_object()
        metadata = request.data.get('metadata', {})
        
        document.metadata.update(metadata)
        document.save()
        
        # Логируем активность
        ArchiveActivity.objects.create(
            document=document,
            user=request.user,
            activity_type='metadata_updated',
            description=f"Метаданные обновлены: {list(metadata.keys())}"
        )
        
        return Response({'status': 'Metadata updated successfully'})
    
    def _has_download_permission(self, user, document):
        """Проверка прав на скачивание"""
        # Владелец всегда может скачать
        if document.archived_by == user:
            return True
        
        # Проверяем специальные права
        return ArchivePermission.objects.filter(
            document=document,
            user=user,
            permission_type__in=['download', 'admin']
        ).exists()
    
    def _get_client_ip(self, request):
        """Получение IP адреса клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ArchiveCategoryViewSet(viewsets.ModelViewSet):
    """API для работы с категориями архива"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ArchiveCategoryCreateSerializer
        elif self.action == 'list':
            return ArchiveCategoryListSerializer
        return ArchiveCategorySerializer
    
    def get_queryset(self):
        queryset = ArchiveCategory.objects.select_related(
            'parent', 'retention_policy', 'created_by'
        ).prefetch_related('documents')
        
        # Только активные категории
        active_only = self.request.query_params.get('active_only', 'true')
        if active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Корневые категории
        root_only = self.request.query_params.get('root_only', 'false')
        if root_only.lower() == 'true':
            queryset = queryset.filter(parent=None)
        
        return queryset.order_by('parent__name', 'name')
    
    @action(detail=True, methods=['get'])
    def tree(self, request, pk=None):
        """Получение дерева подкategорий"""
        category = self.get_object()
        children = category.get_all_children()
        
        serializer = ArchiveCategoryListSerializer(children, many=True)
        return Response({
            'category': ArchiveCategorySerializer(category).data,
            'children': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Получение документов в категории"""
        category = self.get_object()
        documents = ArchivedDocument.objects.filter(category=category)
        
        # Пагинация
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = ArchivedDocumentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ArchivedDocumentListSerializer(documents, many=True)
        return Response(serializer.data)


class AutoArchivingRuleViewSet(viewsets.ModelViewSet):
    """API для работы с правилами автоархивирования"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AutoArchivingRuleCreateSerializer
        return AutoArchivingRuleSerializer
    
    def get_queryset(self):
        return AutoArchivingRule.objects.select_related(
            'target_category', 'created_by'
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Ручное выполнение правила"""
        rule = self.get_object()
        
        try:
            auto_service = AutoArchivingService()
            job = auto_service.execute_archiving_rule(rule)
            
            serializer = ArchivingJobSerializer(job)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error executing rule {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to execute rule'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Переключение статуса правила"""
        rule = self.get_object()
        new_status = 'active' if rule.status == 'inactive' else 'inactive'
        rule.status = new_status
        rule.save()
        
        return Response({
            'status': new_status,
            'message': f'Rule status changed to {new_status}'
        })


class ArchivingJobViewSet(viewsets.ModelViewSet):
    """API для работы с заданиями архивирования"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ArchivingJobCreateSerializer
        return ArchivingJobSerializer
    
    def get_queryset(self):
        return ArchivingJob.objects.select_related(
            'auto_rule', 'target_category', 'created_by'
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отмена задания"""
        job = self.get_object()
        
        if job.status in ['pending', 'running']:
            job.status = 'cancelled'
            job.save()
            return Response({'status': 'Job cancelled successfully'})
        else:
            return Response(
                {'error': 'Job cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Получение логов задания"""
        job = self.get_object()
        return Response({
            'error_log': job.error_log,
            'results': job.results
        })


class ArchiveAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """API для аналитики архива"""
    permission_classes = [IsAuthenticated]
    serializer_class = ArchiveAnalyticsSerializer
    
    def get_queryset(self):
        return ArchiveAnalytics.objects.select_related('category').order_by('-metric_date')


class ArchiveStatsView(APIView):
    """Общая статистика архива"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получение статистики архива"""
        try:
            analytics_service = ArchiveAnalyticsService()
            stats = analytics_service.get_dashboard_stats()
            
            serializer = ArchiveStatsSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error getting archive stats: {str(e)}")
            return Response(
                {'error': 'Failed to get statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SemanticSearchView(APIView):
    """Семантический поиск по архиву"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Выполнение семантического поиска"""
        serializer = SemanticSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            search_service = ArchiveSearchService()
            results = search_service.semantic_search(
                query=serializer.validated_data['query'],
                limit=serializer.validated_data['limit'],
                category_id=serializer.validated_data.get('category_id'),
                similarity_threshold=serializer.validated_data['similarity_threshold']
            )
            
            return Response({
                'results': results,
                'query': serializer.validated_data['query'],
                'total_found': len(results)
            })
            
        except Exception as e:
            logger.error(f"Error in semantic search: {str(e)}")
            return Response(
                {'error': 'Search failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalyticsReportView(APIView):
    """Генерация аналитических отчетов"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Генерация отчета"""
        serializer = AnalyticsReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            analytics_service = ArchiveAnalyticsService()
            report_data = analytics_service.generate_report(
                report_type=serializer.validated_data['report_type'],
                date_from=serializer.validated_data['date_from'],
                date_to=serializer.validated_data['date_to'],
                category_ids=serializer.validated_data.get('category_ids', [])
            )
            
            format_type = serializer.validated_data['format']
            
            if format_type == 'csv':
                return self._export_csv(report_data, serializer.validated_data['report_type'])
            elif format_type == 'pdf':
                return self._export_pdf(report_data, serializer.validated_data['report_type'])
            else:
                return Response(report_data)
                
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            return Response(
                {'error': 'Failed to generate report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _export_csv(self, data, report_type):
        """Экспорт в CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        if not data:
            return response
        
        writer = csv.DictWriter(response, fieldnames=data[0].keys())
        writer.writeheader()
        for row in data:
            writer.writerow(row)
        
        return response
    
    def _export_pdf(self, data, report_type):
        """Экспорт в PDF (заглушка)"""
        # Здесь будет реализация экспорта в PDF
        return Response(
            {'error': 'PDF export not implemented yet'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class ArchiveActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """API для просмотра активности в архиве"""
    permission_classes = [IsAuthenticated]
    serializer_class = ArchiveActivitySerializer
    
    def get_queryset(self):
        queryset = ArchiveActivity.objects.select_related(
            'document', 'user'
        ).order_by('-created_at')
        
        # Фильтр по документу
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        # Фильтр по пользователю
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Фильтр по типу активности
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        return queryset[:100]  # Ограничиваем результат


class DocumentEmbeddingViewSet(viewsets.ReadOnlyModelViewSet):
    """API для просмотра векторных представлений"""
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentEmbeddingSerializer
    
    def get_queryset(self):
        return DocumentEmbedding.objects.select_related('document').order_by('-created_at')


class AIAnalysisResultViewSet(viewsets.ReadOnlyModelViewSet):
    """API для просмотра результатов ИИ анализа"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIAnalysisResultSerializer
    
    def get_queryset(self):
        return AIAnalysisResult.objects.select_related('document').order_by('-created_at')


class RetentionPolicyViewSet(viewsets.ModelViewSet):
    """API для работы с политиками хранения"""
    permission_classes = [IsAuthenticated]
    serializer_class = RetentionPolicySerializer
    queryset = RetentionPolicy.objects.all()


class ComplianceRuleViewSet(viewsets.ModelViewSet):
    """API для работы с правилами соответствия"""
    permission_classes = [IsAuthenticated]
    serializer_class = ComplianceRuleSerializer
    queryset = ComplianceRule.objects.all()


class ArchivePermissionViewSet(viewsets.ModelViewSet):
    """API для управления правами доступа к архиву"""
    permission_classes = [IsAuthenticated]
    serializer_class = ArchivePermissionSerializer
    
    def get_queryset(self):
        return ArchivePermission.objects.select_related(
            'document', 'user', 'granted_by'
        ).order_by('-granted_at')
