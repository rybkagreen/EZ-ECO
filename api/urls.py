from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Простые endpoints для начального тестирования
urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('files/', views.simple_file_list, name='simple_file_list'),
    path('files/directory/', views.simple_directory_listing, name='simple_directory_listing'),
    path('upload/', views.simple_file_upload, name='simple_file_upload'),
    path('create-directory/', views.create_directory, name='create_directory'),
    path('delete-file/', views.delete_file, name='delete_file'),
    path('move-file/', views.move_file, name='move_file'),
    path('create-folder/', views.create_folder, name='create_folder'),
    path('file-content/', views.file_content, name='file_content'),
]
