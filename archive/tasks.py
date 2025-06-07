"""
Celery задачи для модуля архива.
Фоновые операции автоархивирования, анализа и очистки.
"""

from celery import shared_task
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import timedelta
import logging

from .models import (
    ArchivedDocument, AutoArchivingRule, ArchivingJob,
    ArchiveActivity, AIAnalysisResult, DocumentEmbedding
)
from .services import AutoArchivingService, ArchiveAnalyticsService
from filemanager.models import FileItem

logger = logging.getLogger(__name__)


@shared_task
def execute_auto_archiving_rule(rule_id):
    """
    Выполнение правила автоархивирования.
    """
    try:
        rule = AutoArchivingRule.objects.get(id=rule_id, is_active=True)
        service = AutoArchivingService()
        
        # Создание задания архивирования
        job = ArchivingJob.objects.create(
            name=f"Автоархивирование: {rule.name}",
            job_type='auto_archiving',
            auto_rule=rule,
            created_by=rule.created_by,
            status='running'
        )
        
        try:
            # Поиск файлов соответствующих правилу
            query_filters = rule.file_filters
            files_query = FileItem.objects.filter(**query_filters)
            
            # Дополнительные фильтры
            if rule.min_file_age:
                cutoff_date = timezone.now() - timedelta(days=rule.min_file_age)
                files_query = files_query.filter(created_at__lte=cutoff_date)
            
            if rule.file_size_min:
                files_query = files_query.filter(size__gte=rule.file_size_min)
            
            if rule.file_size_max:
                files_query = files_query.filter(size__lte=rule.file_size_max)
            
            # Исключаем уже архивированные файлы
            files_query = files_query.exclude(
                id__in=ArchivedDocument.objects.values_list('original_file_id', flat=True)
            )
            
            files_to_archive = list(files_query[:rule.max_files_per_run or 100])
            
            archived_count = 0
            error_count = 0
            
            for file_item in files_to_archive:
                try:
                    archived_doc = service.archive_document(
                        file_item=file_item,
                        user=rule.created_by,
                        category=rule.target_category,
                        note=f"Автоархивирование по правилу: {rule.name}"
                    )
                    archived_count += 1
                    
                    # Запуск ИИ анализа если включен
                    if rule.ai_analysis_enabled:
                        analyze_document_ai.delay(archived_doc.id)
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error archiving file {file_item.id}: {str(e)}")
            
            # Обновление статуса задания
            job.status = 'completed'
            job.processed_files = archived_count
            job.error_count = error_count
            job.completed_at = timezone.now()
            job.result = {
                'archived_files': archived_count,
                'errors': error_count,
                'total_candidates': len(files_to_archive)
            }
            job.save()
            
            # Планирование следующего запуска
            if rule.schedule_enabled:
                rule.last_run = timezone.now()
                rule.next_run = service.calculate_next_run(rule)
                rule.save()
            
            return {
                'success': True,
                'archived_count': archived_count,
                'error_count': error_count
            }
            
        except Exception as e:
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()
            raise
            
    except AutoArchivingRule.DoesNotExist:
        logger.error(f"Auto archiving rule {rule_id} not found")
        return {'success': False, 'error': 'Rule not found'}
    except Exception as e:
        logger.error(f"Error executing auto archiving rule {rule_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def analyze_document_ai(document_id):
    """
    ИИ анализ архивного документа.
    """
    try:
        document = ArchivedDocument.objects.get(id=document_id)
        service = AutoArchivingService()
        
        # Выполнение различных типов анализа
        analysis_tasks = [
            'content_classification',
            'entity_extraction',
            'topic_modeling'
        ]
        
        for analysis_type in analysis_tasks:
            try:
                # Здесь будет вызов ИИ сервиса
                # Пока создаем заглушку
                AIAnalysisResult.objects.create(
                    document=document,
                    analysis_type=analysis_type,
                    ai_model='ollama_llama3.2',
                    results={'status': 'completed', 'analysis_type': analysis_type},
                    confidence_score=0.85,
                    processing_time=2.5
                )
                
            except Exception as e:
                logger.error(f"Error in {analysis_type} for document {document_id}: {str(e)}")
        
        # Создание embedding
        create_document_embedding.delay(document_id)
        
        return {'success': True, 'document_id': document_id}
        
    except ArchivedDocument.DoesNotExist:
        logger.error(f"Document {document_id} not found for AI analysis")
        return {'success': False, 'error': 'Document not found'}
    except Exception as e:
        logger.error(f"Error analyzing document {document_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def create_document_embedding(document_id):
    """
    Создание векторного представления документа.
    """
    try:
        document = ArchivedDocument.objects.get(id=document_id)
        
        # Пока создаем заглушку embedding
        DocumentEmbedding.objects.create(
            document=document,
            content_embedding=[0.1] * 768,  # Фиктивный embedding
            metadata_embedding=[0.05] * 768,
            keywords=['document', 'archive', 'ai'],
            embedding_model='ollama-embeddings',
            embedding_version='1.0'
        )
        
        return {'success': True, 'document_id': document_id}
        
    except ArchivedDocument.DoesNotExist:
        logger.error(f"Document {document_id} not found for embedding")
        return {'success': False, 'error': 'Document not found'}
    except Exception as e:
        logger.error(f"Error creating embedding for document {document_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_expired_documents():
    """
    Очистка документов с истекшим сроком хранения.
    """
    try:
        expired_docs = ArchivedDocument.objects.filter(
            retention_date__lte=timezone.now(),
            status='archived'
        )
        
        expired_count = 0
        for doc in expired_docs:
            doc.status = 'expired'
            doc.save()
            
            # Логирование
            ArchiveActivity.objects.create(
                document=doc,
                activity_type='document_expired',
                description=f'Документ "{doc.original_file.name}" истек по сроку хранения'
            )
            expired_count += 1
        
        return {'success': True, 'expired_count': expired_count}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired documents: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_old_activities():
    """
    Очистка старых записей активности.
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=90)
        deleted_count, _ = ArchiveActivity.objects.filter(
            created_at__lt=cutoff_date
        ).delete()
        
        return {'success': True, 'deleted_count': deleted_count}
        
    except Exception as e:
        logger.error(f"Error cleaning up old activities: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def generate_analytics_report():
    """
    Генерация ежедневного аналитического отчета.
    """
    try:
        service = ArchiveAnalyticsService()
        today = timezone.now().date()
        
        # Генерация различных метрик
        metrics = [
            'storage_usage',
            'archive_rate', 
            'access_frequency',
            'category_distribution',
            'retention_compliance',
            'ai_accuracy'
        ]
        
        results = {}
        for metric in metrics:
            try:
                result = service.calculate_metric(metric, today)
                results[metric] = result
            except Exception as e:
                logger.error(f"Error calculating {metric}: {str(e)}")
                results[metric] = {'error': str(e)}
        
        return {'success': True, 'date': today.isoformat(), 'results': results}
        
    except Exception as e:
        logger.error(f"Error generating analytics report: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def batch_archive_files(file_ids, category_id, user_id):
    """
    Массовое архивирование файлов.
    """
    try:
        user = User.objects.get(id=user_id)
        service = AutoArchivingService()
        
        job = ArchivingJob.objects.create(
            name=f"Массовое архивирование {len(file_ids)} файлов",
            job_type='manual_batch',
            created_by=user,
            status='running',
            total_files=len(file_ids)
        )
        
        archived_count = 0
        error_count = 0
        
        for file_id in file_ids:
            try:
                file_item = FileItem.objects.get(id=file_id)
                archived_doc = service.archive_document(
                    file_item=file_item,
                    user=user,
                    category_id=category_id,
                    note="Массовое архивирование"
                )
                archived_count += 1
                
                # Запуск ИИ анализа
                analyze_document_ai.delay(archived_doc.id)
                
            except Exception as e:
                error_count += 1
                logger.error(f"Error archiving file {file_id}: {str(e)}")
        
        job.status = 'completed'
        job.processed_files = archived_count
        job.error_count = error_count
        job.completed_at = timezone.now()
        job.save()
        
        return {
            'success': True,
            'job_id': job.id,
            'archived_count': archived_count,
            'error_count': error_count
        }
        
    except Exception as e:
        logger.error(f"Error in batch archive: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def scheduled_auto_archiving():
    """
    Планировщик для выполнения всех активных правил автоархивирования.
    """
    try:
        now = timezone.now()
        
        # Найти правила готовые к выполнению
        ready_rules = AutoArchivingRule.objects.filter(
            is_active=True,
            schedule_enabled=True,
            next_run__lte=now
        )
        
        scheduled_count = 0
        for rule in ready_rules:
            try:
                execute_auto_archiving_rule.delay(rule.id)
                scheduled_count += 1
            except Exception as e:
                logger.error(f"Error scheduling rule {rule.id}: {str(e)}")
        
        return {'success': True, 'scheduled_count': scheduled_count}
        
    except Exception as e:
        logger.error(f"Error in scheduled auto archiving: {str(e)}")
        return {'success': False, 'error': str(e)}
