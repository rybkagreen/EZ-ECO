import asyncio
import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from django.conf import settings

class FileSystemEventHandlerAsync(FileSystemEventHandler):
    def __init__(self, callback):
        self.callback = callback
        super().__init__()

    def on_any_event(self, event):
        if event.is_directory:
            return
        
        # Игнорируем временные файлы
        if event.src_path.endswith(('.tmp', '.swp', '.swx')):
            return
            
        event_type = {
            'created': 'create',
            'modified': 'modify',
            'deleted': 'delete',
            'moved': 'move'
        }.get(event.event_type, event.event_type)

        relative_path = os.path.relpath(event.src_path, settings.MEDIA_ROOT)
        
        data = {
            'type': event_type,
            'path': relative_path
        }
        
        if hasattr(event, 'dest_path'):
            data['dest_path'] = os.path.relpath(event.dest_path, settings.MEDIA_ROOT)
            
        asyncio.create_task(self.callback(data))
