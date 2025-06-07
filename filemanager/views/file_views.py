from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from filemanager.models import FileItem, FileVersion, FilePermission
from api.serializers.base import FileItemSerializer, FileVersionSerializer, FilePermissionSerializer
from django.shortcuts import get_object_or_404
import os

class FileItemViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с файлами и директориями"""
    serializer_class = FileItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return FileItem.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Перемещение файла/директории"""
        file_item = self.get_object()
        new_parent_id = request.data.get('new_parent_id')
        
        if new_parent_id:
            new_parent = get_object_or_404(FileItem, id=new_parent_id)
            if not new_parent.is_directory:
                return Response(
                    {'error': 'Target is not a directory'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            file_item.parent = new_parent
        else:
            file_item.parent = None
            
        file_item.save()
        return Response(FileItemSerializer(file_item).data)

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """Копирование файла/директории"""
        file_item = self.get_object()
        new_parent_id = request.data.get('new_parent_id')
        
        new_parent = None
        if new_parent_id:
            new_parent = get_object_or_404(FileItem, id=new_parent_id)
            if not new_parent.is_directory:
                return Response(
                    {'error': 'Target is not a directory'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Создаем копию файла
        new_file = FileItem.objects.create(
            name=f"Copy of {file_item.name}",
            path=new_parent.path if new_parent else "",
            is_directory=file_item.is_directory,
            mime_type=file_item.mime_type,
            size=file_item.size,
            owner=request.user,
            parent=new_parent
        )

        return Response(FileItemSerializer(new_file).data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск файлов по имени"""
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        files = self.get_queryset().filter(name__icontains=query)
        serializer = self.get_serializer(files, many=True)
        return Response(serializer.data)

class FileVersionViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с версиями файлов"""
    serializer_class = FileVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FileVersion.objects.filter(file__owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class FilePermissionViewSet(viewsets.ModelViewSet):
    """ViewSet для управления правами доступа"""
    serializer_class = FilePermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FilePermission.objects.filter(
            file__owner=self.request.user
        ) | FilePermission.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(granted_by=self.request.user)
