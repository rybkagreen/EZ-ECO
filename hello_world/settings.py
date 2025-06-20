"""
Django settings for hello_world project.

Generated by 'django-admin startproject' using Django 5.0.4.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/topics/settings/
"""

import os
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY", default='')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=True)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0').split(',')

if 'CODESPACE_NAME' in os.environ:
    codespace_name = config("CODESPACE_NAME")
    codespace_domain = config("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN")
    CSRF_TRUSTED_ORIGINS = [f'https://{codespace_name}-8000.{codespace_domain}']

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_browser_reload",
    
    # Channels & WebSocket
    "channels",
    "channels_redis",
    
    # REST Framework
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    
    # Storage
    "storages",
    
    # Приложения проекта
    "filemanager.apps.FilemanagerConfig",
    "ai_integration.apps.AiIntegrationConfig",
    "api.apps.ApiConfig",
    "archive.apps.ArchiveConfig",
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # Временно для разработки
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_browser_reload.middleware.BrowserReloadMiddleware",
]

X_FRAME_OPTIONS = "ALLOW-FROM preview.app.github.dev"

ROOT_URLCONF = "hello_world.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "hello_world" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "hello_world.wsgi.application"
ASGI_APPLICATION = "hello_world.asgi.application"

# Channels configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [config("REDIS_URL", default="redis://127.0.0.1:6379")],
        },
    },
}


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATICFILES_DIRS = [
    BASE_DIR / "hello_world" / "static",
]

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "hello_world" / "staticfiles"

# Media files
MEDIA_URL = "media/"
MEDIA_ROOT = config("MEDIA_ROOT", default=str(BASE_DIR / "hello_world" / "media"))

# Static files
STATIC_URL = "static/"
STATIC_ROOT = config("STATIC_ROOT", default=str(BASE_DIR / "staticfiles"))

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Celery Configuration
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# File Upload Settings
MAX_UPLOAD_SIZE = config('MAX_UPLOAD_SIZE', default=104857600, cast=int)  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE
FILE_UPLOAD_PERMISSIONS = 0o644

# Allowed file types
ALLOWED_FILE_TYPES = config('ALLOWED_FILE_TYPES', default='.txt,.pdf,.docx,.py,.js,.html,.css,.md,.json,.xml').split(',')

# CORS settings
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # Только для разработки

# Добавляем CORS для GitHub Codespaces
if 'CODESPACE_NAME' in os.environ:
    codespace_name = os.environ.get('CODESPACE_NAME')
    codespace_domain = os.environ.get('GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN')
    CORS_ALLOWED_ORIGINS.append(f"https://{codespace_name}-3000.{codespace_domain}")

# Ollama Settings
OLLAMA_BASE_URL = config('OLLAMA_BASE_URL', default='http://localhost:11434')
OLLAMA_DEFAULT_MODEL = config('OLLAMA_DEFAULT_MODEL', default='llama3.2:1b')
OLLAMA_TIMEOUT = config('OLLAMA_TIMEOUT', default=60, cast=int)
OLLAMA_MAX_TOKENS = config('OLLAMA_MAX_TOKENS', default=4096, cast=int)

# File Storage Settings
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
if not DEBUG:
    # Для продакшена можно настроить S3
    pass
