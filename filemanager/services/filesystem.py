# filepath: /workspaces/codespaces-django/filemanager/services/filesystem.py
import os
import shutil
from typing import List, Dict, Any, Optional
from pathlib import Path
import mimetypes
import stat
from datetime import datetime


class FileSystemService:
    """Сервис для работы с файловой системой"""
    
    def __init__(self, base_path: str = "/workspaces/codespaces-django"):
        self.base_path = Path(base_path).resolve()
    
    def get_safe_path(self, path: str) -> Path:
        """Получает безопасный путь, предотвращая выход за пределы базовой директории"""
        requested_path = Path(path)
        if requested_path.is_absolute():
            # Если путь абсолютный, проверяем что он внутри base_path
            resolved_path = requested_path.resolve()
        else:
            # Если относительный, присоединяем к base_path
            resolved_path = (self.base_path / requested_path).resolve()
        
        # Проверяем что путь не выходит за пределы base_path
        try:
            resolved_path.relative_to(self.base_path)
        except ValueError:
            raise PermissionError(f"Access denied: path {path} is outside allowed directory")
        
        return resolved_path
    
    def list_directory(self, path: str = "/") -> List[Dict[str, Any]]:
        """Возвращает список файлов и папок в директории"""
        safe_path = self.get_safe_path(path)
        
        if not safe_path.exists():
            raise FileNotFoundError(f"Directory {path} not found")
        
        if not safe_path.is_dir():
            raise NotADirectoryError(f"{path} is not a directory")
        
        items = []
        try:
            for item in safe_path.iterdir():
                try:
                    stat_info = item.stat()
                    items.append({
                        'name': item.name,
                        'path': str(item.relative_to(self.base_path)),
                        'full_path': str(item),
                        'is_directory': item.is_dir(),
                        'size': stat_info.st_size if item.is_file() else 0,
                        'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                        'permissions': oct(stat_info.st_mode)[-3:],
                        'mime_type': mimetypes.guess_type(str(item))[0] if item.is_file() else None,
                    })
                except (OSError, PermissionError):
                    # Пропускаем файлы к которым нет доступа
                    continue
        except PermissionError:
            raise PermissionError(f"Permission denied: cannot read directory {path}")
        
        # Сортируем: сначала папки, потом файлы
        items.sort(key=lambda x: (not x['is_directory'], x['name'].lower()))
        return items
    
    def delete_item(self, path: str) -> bool:
        """Удаляет файл или директорию"""
        safe_path = self.get_safe_path(path)
        
        if not safe_path.exists():
            raise FileNotFoundError(f"Item {path} not found")
        
        try:
            if safe_path.is_dir():
                shutil.rmtree(safe_path)
            else:
                safe_path.unlink()
            return True
        except OSError as e:
            raise OSError(f"Failed to delete {path}: {e}")
    
    def get_project_info(self) -> Dict[str, Any]:
        """Возвращает информацию о проекте"""
        try:
            total_files = 0
            total_dirs = 0
            total_size = 0
            
            for root, dirs, files in os.walk(self.base_path):
                # Пропускаем скрытые директории и node_modules
                dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules' and d != '__pycache__']
                
                total_dirs += len(dirs)
                for file in files:
                    if not file.startswith('.'):
                        file_path = Path(root) / file
                        try:
                            total_size += file_path.stat().st_size
                            total_files += 1
                        except OSError:
                            continue
            
            return {
                'base_path': str(self.base_path),
                'total_files': total_files,
                'total_directories': total_dirs,
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
            }
        except OSError as e:
            raise OSError(f"Failed to get project info: {e}")
    
    def create_directory(self, path: str) -> Dict[str, Any]:
        """Создает новую директорию"""
        safe_path = self.get_safe_path(path)
        
        if safe_path.exists():
            raise FileExistsError(f"Directory {path} already exists")
        
        try:
            safe_path.mkdir(parents=True, exist_ok=False)
            stat_info = safe_path.stat()
            return {
                'name': safe_path.name,
                'path': str(safe_path.relative_to(self.base_path)),
                'full_path': str(safe_path),
                'is_directory': True,
                'size': 0,
                'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                'permissions': oct(stat_info.st_mode)[-3:],
                'mime_type': None,
            }
        except OSError as e:
            raise OSError(f"Failed to create directory {path}: {e}")
    
    def move_item(self, source_path: str, destination_path: str) -> Dict[str, Any]:
        """Перемещает файл или директорию"""
        safe_source = self.get_safe_path(source_path)
        safe_destination = self.get_safe_path(destination_path)
        
        if not safe_source.exists():
            raise FileNotFoundError(f"Source {source_path} not found")
        
        if safe_destination.exists():
            raise FileExistsError(f"Destination {destination_path} already exists")
        
        try:
            shutil.move(str(safe_source), str(safe_destination))
            stat_info = safe_destination.stat()
            return {
                'name': safe_destination.name,
                'path': str(safe_destination.relative_to(self.base_path)),
                'full_path': str(safe_destination),
                'is_directory': safe_destination.is_dir(),
                'size': stat_info.st_size if safe_destination.is_file() else 0,
                'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                'permissions': oct(stat_info.st_mode)[-3:],
                'mime_type': mimetypes.guess_type(str(safe_destination))[0] if safe_destination.is_file() else None,
            }
        except OSError as e:
            raise OSError(f"Failed to move {source_path} to {destination_path}: {e}")
    
    def copy_item(self, source_path: str, destination_path: str) -> Dict[str, Any]:
        """Копирует файл или директорию"""
        safe_source = self.get_safe_path(source_path)
        safe_destination = self.get_safe_path(destination_path)
        
        if not safe_source.exists():
            raise FileNotFoundError(f"Source {source_path} not found")
        
        if safe_destination.exists():
            raise FileExistsError(f"Destination {destination_path} already exists")
        
        try:
            if safe_source.is_dir():
                shutil.copytree(str(safe_source), str(safe_destination))
            else:
                shutil.copy2(str(safe_source), str(safe_destination))
            
            stat_info = safe_destination.stat()
            return {
                'name': safe_destination.name,
                'path': str(safe_destination.relative_to(self.base_path)),
                'full_path': str(safe_destination),
                'is_directory': safe_destination.is_dir(),
                'size': stat_info.st_size if safe_destination.is_file() else 0,
                'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                'permissions': oct(stat_info.st_mode)[-3:],
                'mime_type': mimetypes.guess_type(str(safe_destination))[0] if safe_destination.is_file() else None,
            }
        except OSError as e:
            raise OSError(f"Failed to copy {source_path} to {destination_path}: {e}")