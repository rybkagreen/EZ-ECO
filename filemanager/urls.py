from django.urls import path, include
from rest_framework.routers import DefaultRouter
from filemanager.views.file_views import FileItemViewSet
from filemanager.views.file_upload import FileUploadView

router = DefaultRouter()
router.register(r'items', FileItemViewSet, basename='fileitem')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
]
