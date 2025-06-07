"""
Django signals for archive app.
Handles automatic operations like metadata extraction, AI analysis, etc.
"""

from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.utils import timezone
from filemanager.models import FileItem
from .models import (
    ArchivedDocument, 
    ArchivingJob, 
    AIAnalysisResult,
    AutoArchivingRule,
    ArchiveActivity
)
from .services import AutoArchivingService


@receiver(post_save, sender=ArchivedDocument)
def archived_document_created(sender, instance, created, **kwargs):
    """
    Обработка создания нового архивного документа.
    """
    if created:
        # Запуск ИИ анализа для нового документа
        try:
            ai_service = AutoArchivingService()
            # ai_service.analyze_document_async(instance.id)  # Пока отключим
        except Exception as e:
            print(f"Error starting AI analysis for document {instance.id}: {e}")
        
        # Логирование архивирования
        ArchiveActivity.objects.create(
            document=instance,
            user=instance.archived_by,
            activity_type='document_archived',
            description=f'Документ "{instance.original_file.name}" архивирован в категорию "{instance.category.name}"'
        )


@receiver(post_save, sender=ArchivingJob)
def archiving_job_status_changed(sender, instance, **kwargs):
    """
    Обработка изменения статуса задания архивирования.
    """
    if instance.status == 'completed' and instance.user:
        # Логирование завершения задания
        ArchiveActivity.objects.create(
            user=instance.user,
            activity_type='job_completed', 
            description=f'Задание "{instance.name}" успешно завершено. Обработано {instance.processed_files} файлов.'
        )
    elif instance.status == 'failed' and instance.user:
        # Логирование ошибки
        ArchiveActivity.objects.create(
            user=instance.user,
            activity_type='job_failed',
            description=f'Задание "{instance.name}" завершилось с ошибкой: {instance.error_message}'
        )


@receiver(post_save, sender=AIAnalysisResult)
def ai_analysis_completed(sender, instance, created, **kwargs):
    """
    Обработка завершения ИИ анализа документа.
    """
    if created and instance.confidence_score > 0:
        # Логирование завершения анализа
        ArchiveActivity.objects.create(
            document=instance.document,
            user=instance.document.archived_by,
            activity_type='ai_analysis_completed',
            description=f'ИИ анализ завершен. Точность: {instance.confidence_score:.1%}'
        )


@receiver(pre_delete, sender=ArchivedDocument)
def archived_document_deleting(sender, instance, **kwargs):
    """
    Обработка удаления архивного документа.
    """
    # Логирование операции удаления
    from .models import ArchiveAuditLog
    
    ArchiveAuditLog.objects.create(
        user=getattr(instance, '_deleting_user', None),
        action='document_deleted',
        resource_type='archived_document',
        resource_id=str(instance.id),
        details={
            'title': instance.title,
            'category': instance.category.name if instance.category else None,
            'size': instance.size,
            'archived_at': instance.archived_at.isoformat()
        }
    )


@receiver(post_save, sender=AutoArchivingRule)
def auto_rule_status_changed(sender, instance, **kwargs):
    """
    Обработка изменения статуса правила автоархивирования.
    """
    if instance.status == 'active' and instance.created_by:
        # Логирование активации правила без привязки к документу
        print(f'Правило автоархивирования "{instance.name}" активировано пользователем {instance.created_by.username}')


def check_document_expiry():
    """
    Периодическая проверка истечения срока хранения документов.
    Должна вызываться через Celery задачу.
    """
    from .models import ArchivedDocument
    
    expired_docs = ArchivedDocument.objects.filter(
        retention_date__lte=timezone.now(),
        status='archived'
    )
    
    for doc in expired_docs:
        doc.status = 'expired'
        doc.save()
        
        # Логирование истечения срока
        if doc.archived_by:
            ArchiveActivity.objects.create(
                document=doc,
                user=doc.archived_by,
                activity_type='document_expired',
                description=f'Срок хранения документа "{doc.original_file.name}" истек'
            )


def cleanup_old_activities():
    """
    Очистка старых записей активности (старше 90 дней).
    """
    cutoff_date = timezone.now() - timezone.timedelta(days=90)
    ArchiveActivity.objects.filter(created_at__lt=cutoff_date).delete()
