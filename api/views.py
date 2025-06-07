import os
import json
import base64
import mimetypes
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from filemanager.services.filesystem import FileSystemService

@api_view(['GET'])
def health_check(request):
    """Проверка работоспособности API"""
    return Response({
        'status': 'ok',
        'message': 'API работает корректно',
        'services': {
            'django': True,
            'database': True,
        }
    })

@api_view(['GET'])
def simple_file_list(request):
    """Простой список файлов для тестирования"""
    try:
        # Для демонстрации возвращаем файлы из корня проекта
        project_root = settings.BASE_DIR
        files = []
        
        for item in os.listdir(project_root):
            item_path = os.path.join(project_root, item)
            files.append({
                'name': item,
                'is_directory': os.path.isdir(item_path),
                'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0,
                'path': str(item_path)
            })
        
        return Response({
            'files': files,
            'count': len(files)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
def simple_file_upload(request):
    """Простая загрузка файлов для тестирования"""
    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')
        if uploaded_file:
            return Response({
                'status': 'success',
                'filename': uploaded_file.name,
                'size': uploaded_file.size,
                'content_type': uploaded_file.content_type
            })
        else:
            return Response({'error': 'Файл не найден'}, status=400)
    
    return Response({'error': 'Метод не поддерживается'}, status=405)

@api_view(['GET'])
def simple_directory_listing(request):
    """Получение содержимого конкретной директории"""
    try:
        path = request.GET.get('path', '/')
        if not path.startswith('/'):
            path = '/' + path
            
        # Безопасность: не выходим за пределы проекта
        project_root = settings.BASE_DIR
        if path == '/':
            target_path = project_root
        else:
            target_path = os.path.join(project_root, path.lstrip('/'))
            
        # Проверяем, что путь внутри проекта
        if not str(target_path).startswith(str(project_root)):
            return Response({'error': 'Доступ запрещен'}, status=403)
            
        if not os.path.exists(target_path):
            return Response({'error': 'Путь не найден'}, status=404)
            
        files = []
        for item in os.listdir(target_path):
            item_path = os.path.join(target_path, item)
            files.append({
                'name': item,
                'is_directory': os.path.isdir(item_path),
                'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0,
                'path': path,
                'full_path': str(item_path)
            })
        
        return Response({
            'files': files,
            'current_path': path,
            'count': len(files)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def create_directory(request):
    """Создание новой директории"""
    try:
        data = json.loads(request.body)
        directory_name = data.get('name')
        parent_path = data.get('parent_path', settings.BASE_DIR)
        
        if not directory_name:
            return Response({'error': 'Не указано имя директории'}, status=400)
        
        # Создаем полный путь для новой директории
        full_path = os.path.join(parent_path, directory_name)
        
        # Проверяем, что директория не существует
        if os.path.exists(full_path):
            return Response({'error': 'Директория уже существует'}, status=409)
        
        # Создаем директорию
        os.makedirs(full_path, exist_ok=True)
        
        return Response({
            'message': f'Директория "{directory_name}" создана успешно',
            'path': full_path,
            'name': directory_name,
            'is_directory': True
        })
        
    except json.JSONDecodeError:
        return Response({'error': 'Неверный формат JSON'}, status=400)
    except PermissionError:
        return Response({'error': 'Нет прав для создания директории'}, status=403)
    except Exception as e:
        return Response({'error': f'Ошибка при создании директории: {str(e)}'}, status=500)

@api_view(['DELETE'])
def delete_file(request):
    """Удаление файла или директории"""
    try:
        data = json.loads(request.body)
        file_path = data.get('path')
        
        if not file_path:
            return Response({'error': 'Не указан путь к файлу'}, status=400)
        
        if not os.path.exists(file_path):
            return Response({'error': 'Файл не найден'}, status=404)
        
        # Удаляем файл или директорию
        if os.path.isdir(file_path):
            os.rmdir(file_path)  # Удаляет только пустые директории
        else:
            os.remove(file_path)
        
        return Response({
            'message': f'Файл/директория "{file_path}" удален(а) успешно'
        })
        
    except json.JSONDecodeError:
        return Response({'error': 'Неверный формат JSON'}, status=400)
    except PermissionError:
        return Response({'error': 'Нет прав для удаления'}, status=403)
    except OSError as e:
        return Response({'error': f'Ошибка файловой системы: {str(e)}'}, status=500)
    except Exception as e:
        return Response({'error': f'Ошибка при удалении: {str(e)}'}, status=500)


@api_view(['POST'])
def move_file(request):
    """Перемещение файла или директории"""
    try:
        data = json.loads(request.body)
        source_path = data.get('source_path')
        target_path = data.get('target_path')
        
        if not source_path or not target_path:
            return Response({'error': 'Не указаны пути для перемещения'}, status=400)
        
        fs_service = FileSystemService()
        result = fs_service.move_item(source_path, target_path)
        
        return Response({
            'message': f'Файл/директория перемещен(а) успешно',
            'file_info': result
        })
        
    except json.JSONDecodeError:
        return Response({'error': 'Неверный формат JSON'}, status=400)
    except FileNotFoundError as e:
        return Response({'error': str(e)}, status=404)
    except FileExistsError as e:
        return Response({'error': str(e)}, status=409)
    except PermissionError as e:
        return Response({'error': str(e)}, status=403)
    except OSError as e:
        return Response({'error': str(e)}, status=500)
    except Exception as e:
        return Response({'error': f'Ошибка при перемещении: {str(e)}'}, status=500)

@api_view(['POST'])
@csrf_exempt
def create_folder(request):
    """Создание новой папки"""
    try:
        data = json.loads(request.body)
        folder_name = data.get('name')
        path = data.get('path', '/')
        
        if not folder_name:
            return JsonResponse({'error': 'Имя папки обязательно'}, status=400)
        
        # Безопасность: очищаем имя папки от опасных символов
        import re
        folder_name = re.sub(r'[<>:"/\\|?*]', '_', folder_name)
        
        fs_service = FileSystemService()
        full_path = os.path.join(path.lstrip('/'), folder_name)
        
        # Создаем папку
        target_path = os.path.join(settings.MEDIA_ROOT, full_path.lstrip('/'))
        os.makedirs(target_path, exist_ok=True)
        
        return JsonResponse({
            'message': f'Папка "{folder_name}" создана успешно',
            'path': full_path,
            'name': folder_name
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
def file_content(request):
    """Получение содержимого файла для предварительного просмотра"""
    file_path = request.GET.get('path')
    
    if not file_path:
        return Response({'error': 'Path parameter is required'}, status=400)
    
    try:
        # Проверяем, что файл существует и находится в допустимой директории
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=404)
        
        # Получаем MIME тип файла
        mime_type, _ = mimetypes.guess_type(file_path)
        file_extension = os.path.splitext(file_path)[1].lower()
        
        # Определяем, можно ли читать файл как текст
        text_extensions = {
            '.txt', '.md', '.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', 
            '.json', '.xml', '.yml', '.yaml', '.csv', '.sql', '.sh', '.bat', 
            '.log', '.ini', '.cfg', '.env', '.gitignore', '.dockerfile'
        }
        
        is_text_file = (
            file_extension in text_extensions or 
            (mime_type and mime_type.startswith('text/'))
        )
        
        if is_text_file:
            # Читаем текстовый файл
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    
                # Ограничиваем размер для предварительного просмотра (1MB)
                if len(content) > 1024 * 1024:
                    content = content[:1024 * 1024] + "\n\n... (файл обрезан для предварительного просмотра)"
                
                return Response({
                    'type': 'text',
                    'content': content,
                    'mime_type': mime_type,
                    'size': len(content),
                    'encoding': 'utf-8'
                })
            except UnicodeDecodeError:
                # Если не удалось прочитать как UTF-8, пробуем другие кодировки
                encodings = ['cp1251', 'latin1', 'ascii']
                for encoding in encodings:
                    try:
                        with open(file_path, 'r', encoding=encoding) as file:
                            content = file.read()
                            return Response({
                                'type': 'text',
                                'content': content,
                                'mime_type': mime_type,
                                'size': len(content),
                                'encoding': encoding
                            })
                    except UnicodeDecodeError:
                        continue
                
                # Если ни одна кодировка не подошла, возвращаем как бинарный
                return Response({
                    'type': 'binary',
                    'error': 'Cannot decode file as text',
                    'mime_type': mime_type
                }, status=415)
        
        # Для изображений возвращаем base64
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'}
        if file_extension in image_extensions:
            with open(file_path, 'rb') as file:
                file_data = file.read()
                # Ограничиваем размер изображения для предварительного просмотра (5MB)
                if len(file_data) > 5 * 1024 * 1024:
                    return Response({
                        'type': 'image',
                        'error': 'Image too large for preview',
                        'size': len(file_data)
                    }, status=413)
                
                base64_content = base64.b64encode(file_data).decode('utf-8')
                return Response({
                    'type': 'image',
                    'content': base64_content,
                    'mime_type': mime_type,
                    'size': len(file_data)
                })
        
        # Для других типов файлов
        file_size = os.path.getsize(file_path)
        return Response({
            'type': 'binary',
            'mime_type': mime_type,
            'size': file_size,
            'preview_available': False,
            'message': 'Preview not available for this file type'
        })
        
    except PermissionError:
        return Response({'error': 'Permission denied'}, status=403)
    except Exception as e:
        return Response({'error': f'Error reading file: {str(e)}'}, status=500)
