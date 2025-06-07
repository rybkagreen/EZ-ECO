from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from filemanager.models import FileItem
from filemanager.services.filesystem import FileSystemService
from api.serializers.base import FileItemSerializer
import os

class FileUploadView(views.APIView):
    """Представление для загрузки файлов"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_obj = request.FILES['file']
        parent_id = request.data.get('parent_id')
        fs_service = FileSystemService()

        try:
            # Получаем или создаем родительскую директорию
            parent = None
            parent_path = ""
            if parent_id:
                parent = FileItem.objects.get(
                    id=parent_id,
                    owner=request.user,
                    is_directory=True
                )
                parent_path = parent.full_path

            # Создаем путь для файла
            file_path = os.path.join(parent_path, file_obj.name)
            
            # Сохраняем файл
            full_path = fs_service.save_file(file_obj, file_path)
            
            # Создаем запись в базе данных
            file_item = FileItem.objects.create(
                name=file_obj.name,
                path=parent_path,
                is_directory=False,
                mime_type=fs_service.get_mime_type(file_path),
                size=fs_service.get_file_size(file_path),
                owner=request.user,
                parent=parent
            )

            # Создаем первую версию файла
            fs_service.create_version(file_item, file_obj)

            return Response(
                FileItemSerializer(file_item).data,
                status=status.HTTP_201_CREATED
            )

        except FileItem.DoesNotExist:
            return Response(
                {'error': 'Parent directory not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
