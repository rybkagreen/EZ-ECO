"""
URL configuration for hello_world project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from hello_world.core import views as core_views

urlpatterns = [
    path("", core_views.index),
    path("admin/", admin.site.urls),
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API endpoints
    path('api/v1/', include('api.urls')),
    path('api/v1/files/', include('filemanager.urls')),
    path('api/v1/ai/', include('ai_integration.urls')),
    path('api/v1/archive/', include('archive.urls')),
    
    # Development tools
    path("__reload__/", include("django_browser_reload.urls")),
]

# Добавляем обработку статических и медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
