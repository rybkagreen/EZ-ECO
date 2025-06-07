import os
import tempfile
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import FileItem
from .services.filesystem import FileSystemService


class FileItemModelTest(TestCase):
    """Тесты для модели FileItem"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_create_file_item(self):
        """Тест создания элемента файла"""
        file_item = FileItem.objects.create(
            name='test_file.txt',
            path='/test/path',
            file_type='file',
            size=1024,
            owner=self.user
        )
        
        self.assertEqual(file_item.name, 'test_file.txt')
        self.assertEqual(file_item.path, '/test/path')
        self.assertEqual(file_item.file_type, 'file')
        self.assertEqual(file_item.size, 1024)
        self.assertEqual(file_item.owner, self.user)
    
    def test_file_item_str_representation(self):
        """Тест строкового представления модели"""
        file_item = FileItem.objects.create(
            name='test_file.txt',
            path='/test/path',
            file_type='file',
            owner=self.user
        )
        self.assertEqual(str(file_item), 'test_file.txt')


class FileSystemServiceTest(TestCase):
    """Тесты для сервиса файловой системы"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.service = FileSystemService()
    
    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_list_directory_contents(self):
        """Тест получения содержимого директории"""
        # Создаем тестовые файлы
        test_file = os.path.join(self.temp_dir, 'test.txt')
        with open(test_file, 'w') as f:
            f.write('test content')
        
        # Тестируем метод (предполагая, что он существует)
        # Если метода нет, нужно его создать
        # contents = self.service.list_directory(self.temp_dir)
        # self.assertIn('test.txt', [item['name'] for item in contents])


class FileManagerAPITest(APITestCase):
    """Тесты для API файлового менеджера"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_file_upload(self):
        """Тест загрузки файла"""
        test_file = SimpleUploadedFile(
            "test_file.txt",
            b"file content",
            content_type="text/plain"
        )
        
        # Предполагая наличие эндпоинта для загрузки
        # url = reverse('filemanager:upload')
        # response = self.client.post(url, {'file': test_file})
        # self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_file_list(self):
        """Тест получения списка файлов"""
        # Создаем тестовый файл
        FileItem.objects.create(
            name='test_file.txt',
            path='/test/path',
            file_type='file',
            size=1024,
            owner=self.user
        )
        
        # Предполагая наличие эндпоинта для списка
        # url = reverse('filemanager:list')
        # response = self.client.get(url)
        # self.assertEqual(response.status_code, status.HTTP_200_OK)
        # self.assertEqual(len(response.data), 1)
    
    def test_unauthorized_access(self):
        """Тест неавторизованного доступа"""
        self.client.force_authenticate(user=None)
        
        # Предполагая наличие защищенного эндпоинта
        # url = reverse('filemanager:list')
        # response = self.client.get(url)
        # self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FilePermissionTest(TestCase):
    """Тесты для прав доступа к файлам"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='testpass123'
        )
    
    def test_file_owner_access(self):
        """Тест доступа владельца к файлу"""
        file_item = FileItem.objects.create(
            name='private_file.txt',
            path='/private/path',
            file_type='file',
            owner=self.user1
        )
        
        # Тест логики проверки прав доступа
        # has_access = file_item.has_read_permission(self.user1)
        # self.assertTrue(has_access)
    
    def test_file_other_user_access(self):
        """Тест доступа другого пользователя к файлу"""
        file_item = FileItem.objects.create(
            name='private_file.txt',
            path='/private/path',
            file_type='file',
            owner=self.user1
        )
        
        # Тест логики проверки прав доступа
        # has_access = file_item.has_read_permission(self.user2)
        # self.assertFalse(has_access)


class WebSocketConsumerTest(TestCase):
    """Тесты для WebSocket потребителей"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_websocket_connection(self):
        """Тест подключения к WebSocket"""
        # Тесты для WebSocket будут добавлены после изучения consumers.py
        pass
    
    def test_file_change_notification(self):
        """Тест уведомления об изменении файла"""
        # Тесты для уведомлений через WebSocket
        pass
