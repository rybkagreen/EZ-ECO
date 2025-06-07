from celery import shared_task
from django.utils import timezone
from ai_integration.models import AIAnalysis
from ai_integration.services.ollama_service import OllamaService
import asyncio

@shared_task
def analyze_file_async(analysis_id):
    """Асинхронная задача для анализа файла с использованием Ollama"""
    try:
        analysis = AIAnalysis.objects.get(id=analysis_id)
        analysis.status = 'processing'
        analysis.save()

        # Инициализация сервиса Ollama
        ollama_service = OllamaService()
        
        # Создаем event loop для асинхронных вызовов
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Выполняем анализ файла
            results = loop.run_until_complete(
                ollama_service.analyze_file_content(
                    analysis.file.full_path,
                    analysis.file.mime_type
                )
            )
            
            # Обновляем запись с результатами
            analysis.results = results
            analysis.status = 'completed'
            
        except Exception as e:
            analysis.status = 'failed'
            analysis.error_message = str(e)
        
        finally:
            loop.close()
            
        analysis.completed_at = timezone.now()
        analysis.save()
        
        return True
        
    except AIAnalysis.DoesNotExist:
        return False
    except Exception as e:
        if 'analysis' in locals():
            analysis.status = 'failed'
            analysis.error_message = str(e)
            analysis.completed_at = timezone.now()
            analysis.save()
        return False

@shared_task
def cleanup_old_analyses():
    """Задача для очистки старых результатов анализа"""
    # Удаляем анализы старше 30 дней
    threshold = timezone.now() - timezone.timedelta(days=30)
    AIAnalysis.objects.filter(
        created_at__lt=threshold,
        status__in=['completed', 'failed']
    ).delete()
    return True
