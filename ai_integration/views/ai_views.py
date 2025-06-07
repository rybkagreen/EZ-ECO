from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
import json
import logging
from django.utils import timezone
from django.contrib.auth.models import User

from ai_integration.models import AIModel, AIAnalysis
from ai_integration.services.ollama_service import get_ollama_service
from filemanager.models import FileItem

logger = logging.getLogger(__name__)


def get_demo_user():
    """Получить или создать демо-пользователя для тестирования"""
    user, created = User.objects.get_or_create(
        username='demo_user',
        defaults={
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User'
        }
    )
    return user


class OllamaStatusView(APIView):
    """Проверка статуса Ollama сервера"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def get(self, request):
        """Проверить подключение к Ollama"""
        service = get_ollama_service()
        is_connected = service.sync_check_connection()
        models = service.sync_get_available_models() if is_connected else []
        
        return Response({
            'connected': is_connected,
            'available_models': models,
            'default_model': service.default_model,
            'base_url': service.base_url
        })


class TextAnalysisView(APIView):
    """Анализ текста через Ollama"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def post(self, request):
        """Анализировать текст"""
        text = request.data.get('text', '')
        model = request.data.get('model')
        analysis_type = request.data.get('analysis_type', 'general')
        
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        service = get_ollama_service()
        
        try:
            # Создаем запись анализа
            ai_model, created = AIModel.objects.get_or_create(
                name=model or service.default_model,
                defaults={
                    'model_type': 'text_analysis',
                    'is_active': True
                }
            )
            
            analysis = AIAnalysis.objects.create(
                user=get_demo_user(),
                ai_model=ai_model,
                analysis_type='text',
                input_data=text,
                status='processing'
            )
            
            # Выполняем анализ
            if analysis_type == 'code':
                language = request.data.get('language', 'python')
                result = service.sync_analyze_code(text, language)
            elif analysis_type == 'document':
                result = service.sync_analyze_text(text, 'summary')
            else:
                result = service.sync_analyze_text(text, analysis_type)
            
            # Обновляем результат
            if result:
                analysis.output_data = json.dumps(result, ensure_ascii=False)
                analysis.result = result
                analysis.status = 'completed'
                analysis.completed_at = timezone.now()
                analysis.save()
                
                return Response({
                    'analysis_id': analysis.id,
                    'result': result,
                    'status': 'completed'
                })
            else:
                analysis.status = 'failed'
                analysis.error_message = 'Failed to get response from AI service'
                analysis.save()
                return Response({
                    'error': 'Failed to analyze text'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            # Обновляем статус ошибки
            if 'analysis' in locals():
                analysis.status = 'failed'
                analysis.error_message = str(e)
                analysis.save()
            
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileAnalysisView(APIView):
    """Анализ файлов через Ollama"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def post(self, request):
        """Анализировать файл"""
        file_id = request.data.get('file_id')
        model = request.data.get('model')
        
        if not file_id:
            return Response({'error': 'File ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_item = FileItem.objects.get(id=file_id)
            service = get_ollama_service()
            
            # Создаем запись анализа
            ai_model, created = AIModel.objects.get_or_create(
                name=model or service.default_model,
                defaults={
                    'model_type': 'file_analysis',
                    'is_active': True
                }
            )
            
            analysis = AIAnalysis.objects.create(
                user=get_demo_user(),
                ai_model=ai_model,
                file_item=file_item,
                analysis_type='file_analysis',
                input_data=f"File: {file_item.name}",
                status='processing'
            )
            
            # Выполняем анализ файла
            try:
                with open(file_item.full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Ограничиваем размер для анализа
                if len(content) > 10000:
                    content = content[:10000] + "\n... (content truncated)"
                
                if file_item.mime_type and 'code' in file_item.mime_type.lower():
                    result = service.sync_analyze_code(content, file_item.extension or 'auto')
                else:
                    result = service.sync_analyze_text(content, 'general')
                
            except Exception as e:
                result = None
                logger.error(f"Error reading file {file_item.full_path}: {e}")
            
            if result:
                analysis.output_data = json.dumps(result, ensure_ascii=False)
                analysis.result = result
                analysis.status = 'completed'
                analysis.completed_at = timezone.now()
            else:
                analysis.status = 'failed'
                analysis.error_message = 'Failed to analyze file'
            
            analysis.save()
            
            return Response({
                'analysis_id': analysis.id,
                'result': result,
                'status': analysis.status,
                'file_name': file_item.name
            })
            
        except FileItem.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SmartSearchView(APIView):
    """Умный поиск через ИИ"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def post(self, request):
        """Выполнить семантический поиск"""
        query = request.data.get('query', '')
        context = request.data.get('context', '')
        file_id = request.data.get('file_id')
        
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        service = get_ollama_service()
        
        try:
            # Если указан файл, используем его как контекст
            if file_id and not context:
                file_item = FileItem.objects.get(id=file_id)
                with open(file_item.full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    context = f.read()[:8000]  # Ограничиваем размер
            
            # Выполняем умный поиск
            prompt = f"""
            Выполни семантический поиск по запросу: "{query}"
            
            Контекст для поиска:
            {context}
            
            Предоставь:
            1. Релевантные фрагменты из контекста
            2. Объяснение соответствия запросу
            3. Дополнительную информацию по теме
            4. Рекомендации для дальнейшего поиска
            """
            
            result = service.sync_generate(prompt)
            
            return Response({
                'query': query,
                'result': result,
                'timestamp': timezone.now()
            })
            
        except FileItem.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalysisHistoryView(APIView):
    """История анализов пользователя"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def get(self, request):
        """Получить историю анализов"""
        analyses = AIAnalysis.objects.filter(user=get_demo_user()).order_by('-created_at')[:50]
        
        data = []
        for analysis in analyses:
            data.append({
                'id': analysis.id,
                'analysis_type': analysis.analysis_type,
                'status': analysis.status,
                'created_at': analysis.created_at,
                'completed_at': analysis.completed_at,
                'file_name': analysis.file_item.name if analysis.file_item else None,
                'model_name': analysis.ai_model.name,
                'has_result': bool(analysis.result)
            })
        
        return Response({
            'analyses': data,
            'total': len(data)
        })


class GenerateTextView(APIView):
    """Генерация текста через Ollama"""
    permission_classes = [AllowAny]  # Temporarily allow access without auth for testing
    
    def post(self, request):
        """Генерировать текст по промпту"""
        prompt = request.data.get('prompt', '')
        model = request.data.get('model')
        
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        service = get_ollama_service()
        
        try:
            result = service.sync_generate(prompt, model)
            
            if result:
                return Response({
                    'prompt': prompt,
                    'response': result.get('response', ''),
                    'model': result.get('model', ''),
                    'created_at': result.get('created_at', ''),
                    'total_duration': result.get('total_duration', 0)
                })
            else:
                return Response({
                    'error': 'Failed to generate response'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
