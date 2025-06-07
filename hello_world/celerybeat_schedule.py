from celery.schedules import crontab

CELERYBEAT_SCHEDULE = {
    'cleanup-old-analyses': {
        'task': 'ai_integration.tasks.analysis_tasks.cleanup_old_analyses',
        'schedule': crontab(hour=0, minute=0),  # Запуск каждый день в полночь
    },
    
    # Задачи архива
    'scheduled-auto-archiving': {
        'task': 'archive.tasks.scheduled_auto_archiving',
        'schedule': crontab(minute='*/30'),  # Каждые 30 минут
    },
    
    'cleanup-expired-documents': {
        'task': 'archive.tasks.cleanup_expired_documents',
        'schedule': crontab(hour=2, minute=0),  # Каждый день в 2:00
    },
    
    'cleanup-old-activities': {
        'task': 'archive.tasks.cleanup_old_activities',
        'schedule': crontab(hour=3, minute=0),  # Каждый день в 3:00
    },
    
    'generate-analytics-report': {
        'task': 'archive.tasks.generate_analytics_report',
        'schedule': crontab(hour=1, minute=0),  # Каждый день в 1:00
    },
}
