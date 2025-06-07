import json
import asyncio
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from filemanager.services.filesystem import FileSystemService
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async

import json
import asyncio
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from filemanager.services.filesystem import FileSystemService
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async

# Простые функции для демонстрации WebSocket
@database_sync_to_async
def get_directory_files(path):
    """Получаем список файлов из файловой системы"""
    try:
        if not os.path.exists(path):
            return []
        
        files = []
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            is_dir = os.path.isdir(item_path)
            size = 0 if is_dir else os.path.getsize(item_path)
            
            files.append({
                'name': item,
                'path': item_path,
                'type': 'directory' if is_dir else 'file',
                'size': size,
                'modified': os.path.getmtime(item_path)
            })
        return files
    except (OSError, PermissionError):
        return []

class FileManagerConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.watched_paths = set()
        self.watch_tasks = {}

    async def connect(self):
        """Обработка подключения клиента"""
        # Для демонстрации принимаем все подключения
        await self.accept()
        
        # Добавляем пользователя в группу для broadcast сообщений
        self.room_group_name = 'file_manager_group'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Отправляем приветственное сообщение
        await self.send(text_data=json.dumps({
            'type': 'connection_status',
            'status': 'connected',
            'message': 'WebSocket connection established'
        }))

    async def disconnect(self, code):
        """Обработка отключения клиента"""
        # Удаляем из группы
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Остановка всех задач отслеживания
        for task in self.watch_tasks.values():
            task.cancel()

    async def receive(self, text_data=None, bytes_data=None):
        """Обработка входящих сообщений"""
        if text_data:
            try:
                data = json.loads(text_data)
                action = data.get('action')
                
                if action == 'list_files':
                    await self.handle_list_files(data)
                elif action == 'watch_directory':
                    await self.handle_watch_directory(data)
                elif action == 'stop_watching':
                    await self.handle_stop_watching(data)
                elif action == 'ping':
                    await self.handle_ping()
                else:
                    await self.send_error(f'Unknown action: {action}')
                    
            except json.JSONDecodeError:
                await self.send_error('Invalid JSON format')
            except Exception as e:
                await self.send_error(f'Error processing message: {str(e)}')

    async def handle_ping(self):
        """Обработка ping сообщений"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': asyncio.get_event_loop().time()
        }))

    async def handle_list_files(self, data):
        """Получение списка файлов"""
        path = data.get('path', '/workspaces/codespaces-django')
        
        try:
            files = await get_directory_files(path)
            await self.send(text_data=json.dumps({
                'type': 'files_list',
                'path': path,
                'files': files[:50]  # Ограничиваем количество файлов
            }))
        except Exception as e:
            await self.send_error(f'Error listing files: {str(e)}')

    async def handle_watch_directory(self, data):
        """Начинаем отслеживать изменения в директории"""
        path = data.get('path', '/workspaces/codespaces-django')
        
        if path not in self.watched_paths:
            self.watched_paths.add(path)
            await self.send_success(f'Started watching {path}')
            
            # Отправляем начальный список файлов
            await self.handle_list_files({'path': path})

    async def handle_stop_watching(self, data):
        """Прекращаем отслеживание директории"""
        path = data.get('path')
        if path and path in self.watched_paths:
            self.watched_paths.remove(path)
            await self.send_success(f'Stopped watching {path}')

    async def send_error(self, message):
        """Отправка сообщения об ошибке"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))

    async def send_success(self, message):
        """Отправка сообщения об успехе"""
        await self.send(text_data=json.dumps({
            'type': 'success',
            'message': message
        }))

    # Методы для групповых сообщений
    async def file_change_message(self, event):
        """Обработка групповых сообщений о изменениях файлов"""
        await self.send(text_data=json.dumps({
            'type': 'file_changes',
            'changes': event['changes']
        }))
