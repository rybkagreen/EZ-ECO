import os
from celery import Celery
from django.conf import settings
from .celerybeat_schedule import CELERYBEAT_SCHEDULE

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hello_world.settings')

app = Celery('filemanager_ai')

# Базовые настройки
app.config_from_object('django.conf:settings', namespace='CELERY')

# Загрузка задач из приложений
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# Настройка периодических задач
app.conf.beat_schedule = CELERYBEAT_SCHEDULE

# Дополнительные настройки Celery
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
