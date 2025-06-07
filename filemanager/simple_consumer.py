import json
import asyncio
import os
import threading
from channels.generic.websocket import AsyncWebsocketConsumer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from .services.filesystem import FileSystemService

class FileChangeHandler(FileSystemEventHandler):
    """Handler для отслеживания изменений файловой системы"""
    
    def __init__(self, consumer):
        self.consumer = consumer
        
    def on_created(self, event):
        asyncio.create_task(self.consumer.notify_file_change('created', event.src_path, event.is_directory))
        
    def on_deleted(self, event):
        asyncio.create_task(self.consumer.notify_file_change('deleted', event.src_path, event.is_directory))
        
    def on_modified(self, event):
        if not event.is_directory:  # Игнорируем изменения директорий
            asyncio.create_task(self.consumer.notify_file_change('modified', event.src_path, event.is_directory))
            
    def on_moved(self, event):
        asyncio.create_task(self.consumer.notify_file_change('moved', event.dest_path, event.is_directory, event.src_path))

class SimpleFileManagerConsumer(AsyncWebsocketConsumer):
    """Упрощенный WebSocket consumer для демонстрации"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.heartbeat_task = None
        self.file_observer = None
        self.watched_path = '/workspaces/codespaces-django'
    
    async def connect(self):
        """Обработка подключения клиента"""
        await self.accept()
        
        # Отправляем приветственное сообщение
        await self.send(text_data=json.dumps({
            'type': 'connection_status',
            'status': 'connected',
            'message': 'WebSocket connection established successfully!'
        }))
        
        # Запускаем heartbeat
        self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
        
        # Запускаем file watcher
        await self.start_file_watcher()

    async def disconnect(self, code):
        """Обработка отключения клиента"""
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            
        if self.file_observer:
            self.file_observer.stop()
            self.file_observer.join()
            
    async def start_file_watcher(self):
        """Запуск мониторинга файловой системы"""
        try:
            event_handler = FileChangeHandler(self)
            self.file_observer = Observer()
            self.file_observer.schedule(event_handler, self.watched_path, recursive=False)
            self.file_observer.start()
        except Exception as e:
            await self.send_error(f'Error starting file watcher: {str(e)}')
            
    async def notify_file_change(self, change_type, path, is_directory, old_path=None):
        """Уведомление о изменении файла"""
        try:
            message = {
                'type': 'file_change',
                'change_type': change_type,
                'path': path,
                'is_directory': is_directory,
                'timestamp': asyncio.get_event_loop().time()
            }
            
            if old_path:
                message['old_path'] = old_path
                
            await self.send(text_data=json.dumps(message))
        except Exception as e:
            # Игнорируем ошибки при отправке уведомлений
            pass
        
    async def send_heartbeat(self):
        """Отправляем периодические heartbeat сообщения"""
        try:
            while True:
                await asyncio.sleep(30)  # Каждые 30 секунд
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat',
                    'timestamp': str(asyncio.get_event_loop().time()),
                    'message': 'Connection is alive!'
                }))
        except asyncio.CancelledError:
            pass
        pass

    async def receive(self, text_data=None, bytes_data=None):
        """Обработка входящих сообщений"""
        try:
            if text_data:
                data = json.loads(text_data)
                action = data.get('action')
                
                if action == 'ping':
                    await self.handle_ping()
                elif action == 'list_files':
                    await self.handle_list_files(data)
                elif action == 'get_project_info':
                    await self.handle_project_info()
                elif action == 'start_watch':
                    await self.handle_start_watch(data)
                elif action == 'stop_watch':
                    await self.handle_stop_watch()
                elif action in ['move', 'copy', 'delete', 'create_directory']:
                    await self.handle_file_operation(data)
                elif action == 'bulk_upload':
                    await self.handle_bulk_upload(data)
                elif action == 'watch_directory':
                    await self.handle_watch_directory(data)
                else:
                    await self.send_error(f'Unknown action: {action}')
                    
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON format')
        except Exception as e:
            await self.send_error(f'Error: {str(e)}')

    async def handle_ping(self):
        """Обработка ping сообщений"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': asyncio.get_event_loop().time(),
            'message': 'Pong from Django WebSocket server!'
        }))

    async def handle_list_files(self, data):
        """Получение списка файлов"""
        path = data.get('path', '/workspaces/codespaces-django')
        
        try:
            if not os.path.exists(path):
                await self.send_error(f'Path does not exist: {path}')
                return
                
            files = []
            for item in os.listdir(path)[:20]:  # Ограничиваем количество
                try:
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
                except (OSError, PermissionError):
                    continue
                    
            await self.send(text_data=json.dumps({
                'type': 'files_list',
                'path': path,
                'files': files,
                'count': len(files)
            }))
            
        except Exception as e:
            await self.send_error(f'Error listing files: {str(e)}')

    async def handle_project_info(self):
        """Получение информации о проекте"""
        project_path = '/workspaces/codespaces-django'
        
        try:
            info = {
                'project_name': 'File Manager with Code Chan',
                'project_path': project_path,
                'backend': 'Django + Channels',
                'frontend': 'React + TypeScript',
                'websocket_status': 'Connected',
                'features': [
                    'Real-time file updates',
                    'AI integration with Code Chan mascot',
                    'Drag & drop file operations',
                    'Multi-user file permissions'
                ]
            }
            
            await self.send(text_data=json.dumps({
                'type': 'project_info',
                'info': info
            }))
            
        except Exception as e:
            await self.send_error(f'Error getting project info: {str(e)}')

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
    
    async def handle_start_watch(self, data):
        """Запуск мониторинга определенной директории"""
        path = data.get('path', self.watched_path)
        
        try:
            # Останавливаем текущий watcher если есть
            if self.file_observer:
                self.file_observer.stop()
                self.file_observer.join()
            
            # Запускаем новый watcher
            self.watched_path = path
            await self.start_file_watcher()
            
            await self.send_success(f'Started watching: {path}')
        except Exception as e:
            await self.send_error(f'Error starting watch: {str(e)}')
            
    async def handle_stop_watch(self):
        """Остановка мониторинга файловой системы"""
        try:
            if self.file_observer:
                self.file_observer.stop()
                self.file_observer.join()
                self.file_observer = None
                await self.send_success('File watching stopped')
            else:
                await self.send_error('No active file watcher')
        except Exception as e:
            await self.send_error(f'Error stopping watch: {str(e)}')

    async def handle_file_operation(self, data):
        """Обработка файловых операций с уведомлениями"""
        operation = data.get('operation')
        source_path = data.get('source_path')
        target_path = data.get('target_path', '')
        
        try:
            fs_service = FileSystemService()
            
            if operation == 'move':
                result = fs_service.move_item(source_path, target_path)
                await self.send(text_data=json.dumps({
                    'type': 'file_operation_result',
                    'operation': 'move',
                    'success': True,
                    'result': result,
                    'message': f'File moved from {source_path} to {target_path}'
                }))
                
                # Уведомляем о изменении через WebSocket
                await self.notify_file_change('moved', target_path, result['is_directory'], source_path)
                
            elif operation == 'copy':
                result = fs_service.copy_item(source_path, target_path)
                await self.send(text_data=json.dumps({
                    'type': 'file_operation_result',
                    'operation': 'copy',
                    'success': True,
                    'result': result,
                    'message': f'File copied from {source_path} to {target_path}'
                }))
                
                await self.notify_file_change('created', target_path, result['is_directory'])
                
            elif operation == 'delete':
                fs_service.delete_item(source_path)
                await self.send(text_data=json.dumps({
                    'type': 'file_operation_result',
                    'operation': 'delete',
                    'success': True,
                    'message': f'File deleted: {source_path}'
                }))
                
                await self.notify_file_change('deleted', source_path, False)
                
            elif operation == 'create_directory':
                result = fs_service.create_directory(source_path)
                await self.send(text_data=json.dumps({
                    'type': 'file_operation_result',
                    'operation': 'create_directory',
                    'success': True,
                    'result': result,
                    'message': f'Directory created: {source_path}'
                }))
                
                await self.notify_file_change('created', source_path, True)
                
            else:
                await self.send_error(f'Unknown operation: {operation}')
                
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'file_operation_result',
                'operation': operation,
                'success': False,
                'error': str(e),
                'message': f'Operation failed: {str(e)}'
            }))

    async def handle_bulk_upload(self, data):
        """Обработка массовой загрузки файлов"""
        files_info = data.get('files', [])
        target_path = data.get('target_path', '/')
        
        try:
            upload_results = []
            
            for file_info in files_info:
                file_name = file_info.get('name')
                file_size = file_info.get('size', 0)
                
                # Симуляция обработки загрузки
                upload_results.append({
                    'name': file_name,
                    'size': file_size,
                    'status': 'uploaded',
                    'path': f"{target_path}/{file_name}"
                })
                
                # Уведомляем о создании файла
                await self.notify_file_change('created', f"{target_path}/{file_name}", False)
            
            await self.send(text_data=json.dumps({
                'type': 'bulk_upload_result',
                'success': True,
                'results': upload_results,
                'message': f'Successfully uploaded {len(upload_results)} files'
            }))
            
        except Exception as e:
            await self.send_error(f'Bulk upload failed: {str(e)}')

    async def handle_watch_directory(self, data):
        """Запуск/остановка наблюдения за директорией"""
        path = data.get('path', '/')
        watch = data.get('watch', True)
        
        try:
            if watch:
                # Обновляем путь для наблюдения
                self.watched_path = path
                
                # Перезапускаем file watcher для новой директории
                if self.file_observer:
                    self.file_observer.stop()
                    self.file_observer.join()
                
                await self.start_file_watcher()
                
                await self.send(text_data=json.dumps({
                    'type': 'directory_watch_status',
                    'watching': True,
                    'path': path,
                    'message': f'Now watching directory: {path}'
                }))
            else:
                # Останавливаем наблюдение
                if self.file_observer:
                    self.file_observer.stop()
                    self.file_observer.join()
                    self.file_observer = None
                
                await self.send(text_data=json.dumps({
                    'type': 'directory_watch_status',
                    'watching': False,
                    'path': path,
                    'message': 'File watching stopped'
                }))
                
        except Exception as e:
            await self.send_error(f'Directory watching failed: {str(e)}')
