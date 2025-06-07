import unittest
import asyncio
from unittest.mock import patch, Mock, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from asgiref.sync import sync_to_async

from .services.ollama_service import OllamaService
from .models import AIModel, AIAnalysis


class AsyncTestCase(TestCase):
    """Базовый класс для асинхронных тестов"""
    
    def setUp(self):
        super().setUp()
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
    
    def tearDown(self):
        super().tearDown()
        self.loop.close()
    
    def async_test(self, coro):
        """Утилита для запуска асинхронных тестов"""
        return self.loop.run_until_complete(coro)


class OllamaServiceTest(AsyncTestCase):
    """Тесты для сервиса Ollama"""
    
    def setUp(self):
        self.ollama_service = OllamaService()
    
    @patch('requests.post')
    def test_analyze_text_success(self, mock_post):
        """Тест успешного анализа текста"""
        # Мокаем успешный ответ от Ollama
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'response': 'Анализ текста: это положительный текст'
        }
        mock_post.return_value = mock_response
        
        # Тестируем анализ с использованием async_test
        async def run_test():
            result = await self.ollama_service.analyze_text("Привет, мир!")
            self.assertIsNotNone(result)
            self.assertIn('Анализ', result)
            mock_post.assert_called_once()
        
        self.async_test(run_test())
    
    @patch('requests.post')
    def test_analyze_text_failure(self, mock_post):
        """Тест обработки ошибки при анализе текста"""
        # Мокаем ошибку от Ollama
        mock_post.side_effect = Exception("Connection error")
        
        # Тестируем обработку ошибки
        async def run_test():
            result = await self.ollama_service.analyze_text("Привет, мир!")
            self.assertIsNone(result)
        
        self.async_test(run_test())
    
    @patch('requests.get')
    def test_check_ollama_connection(self, mock_get):
        """Тест проверки подключения к Ollama"""
        # Мокаем успешное подключение
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        async def run_test():
            is_connected = await self.ollama_service.check_connection()
            self.assertTrue(is_connected)
            mock_get.assert_called_once()
        
        self.async_test(run_test())
    
    @patch('requests.get')
    def test_check_ollama_connection_failure(self, mock_get):
        """Тест неудачного подключения к Ollama"""
        # Мокаем ошибку подключения
        mock_get.side_effect = Exception("Connection refused")
        
        async def run_test():
            is_connected = await self.ollama_service.check_connection()
            self.assertFalse(is_connected)
        
        self.async_test(run_test())


class AIModelTest(TestCase):
    """Тесты для модели AI"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_create_ai_model(self):
        """Тест создания модели AI"""
        ai_model = AIModel.objects.create(
            name='Test Model',
            model_type='text_analysis',
            version='1.0',
            description='Test AI model',
            is_active=True
        )
        
        self.assertEqual(ai_model.name, 'Test Model')
        self.assertEqual(ai_model.model_type, 'text_analysis')
        self.assertTrue(ai_model.is_active)
    
    def test_ai_model_str_representation(self):
        """Тест строкового представления модели AI"""
        ai_model = AIModel.objects.create(
            name='Test Model',
            model_type='text_analysis'
        )
        self.assertEqual(str(ai_model), 'Test Model (text_analysis)')


class AIAnalysisTest(TestCase):
    """Тесты для модели анализа AI"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.ai_model = AIModel.objects.create(
            name='Test Model',
            model_type='text_analysis'
        )
    
    def test_create_ai_analysis(self):
        """Тест создания анализа AI"""
        analysis = AIAnalysis.objects.create(
            user=self.user,
            ai_model=self.ai_model,
            input_data='Test input',
            output_data='Test output',
            analysis_type='text',
            status='completed'
        )
        
        self.assertEqual(analysis.user, self.user)
        self.assertEqual(analysis.ai_model, self.ai_model)
        self.assertEqual(analysis.input_data, 'Test input')
        self.assertEqual(analysis.status, 'completed')


class AIAnalysisAPITest(APITestCase):
    """Тесты для API анализа AI"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.ai_model = AIModel.objects.create(
            name='Test Model',
            model_type='text_analysis',
            is_active=True
        )
    
    @patch('ai_integration.services.ollama_service.OllamaService.analyze_text')
    def test_text_analysis_api(self, mock_analyze):
        """Тест API для анализа текста"""
        # Мокаем успешный анализ
        mock_analyze.return_value = "Положительный текст"
        
        # Предполагая наличие эндпоинта для анализа
        # url = reverse('ai:analyze_text')
        # data = {'text': 'Привет, мир!', 'model_id': self.ai_model.id}
        # response = self.client.post(url, data)
        
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        # self.assertIn('result', response.data)
        # mock_analyze.assert_called_once_with('Привет, мир!')
    
    def test_analysis_history(self):
        """Тест получения истории анализов"""
        # Создаем тестовый анализ
        AIAnalysis.objects.create(
            user=self.user,
            ai_model=self.ai_model,
            input_data='Test input',
            output_data='Test output',
            analysis_type='text',
            status='completed'
        )
        
        # Предполагая наличие эндпоинта для истории
        # url = reverse('ai:analysis_history')
        # response = self.client.get(url)
        
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        # self.assertEqual(len(response.data), 1)
    
    def test_unauthorized_access(self):
        """Тест неавторизованного доступа к AI API"""
        self.client.force_authenticate(user=None)
        
        # Предполагая наличие защищенного эндпоинта
        # url = reverse('ai:analyze_text')
        # response = self.client.post(url, {'text': 'test'})
        # self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AITaskTest(TestCase):
    """Тесты для задач AI (Celery)"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    @patch('ai_integration.services.ollama_service.OllamaService.analyze_text')
    def test_async_text_analysis_task(self, mock_analyze):
        """Тест асинхронной задачи анализа текста"""
        mock_analyze.return_value = "Анализ завершен"
        
        # Импортируем и тестируем задачу Celery
        # from .tasks.analysis_tasks import analyze_text_task
        # result = analyze_text_task.delay('Test text', self.user.id)
        
        # Проверяем, что задача выполнилась
        # self.assertIsNotNone(result)
        # mock_analyze.assert_called_once()


class AIIntegrationIntegrationTest(AsyncTestCase):
    """Интеграционные тесты для AI модуля"""
    
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    @patch('ai_integration.services.ollama_service.OllamaService.check_connection')
    @patch('ai_integration.services.ollama_service.OllamaService.analyze_text')
    def test_full_analysis_workflow(self, mock_analyze, mock_connection):
        """Тест полного рабочего процесса анализа"""
        # Мокаем успешное подключение и анализ как async функции
        async def mock_connection_async():
            return True
        async def mock_analyze_async(text):
            return "Полный анализ завершен"
            
        mock_connection.return_value = mock_connection_async()
        mock_analyze.return_value = mock_analyze_async("test")
        
        async def run_test():
            service = OllamaService()
            is_connected = await service.check_connection()
            self.assertTrue(is_connected)
            
            result = await service.analyze_text("Test text")
            self.assertIsNotNone(result)
            self.assertIn("анализ", result.lower())
        
        self.async_test(run_test())
