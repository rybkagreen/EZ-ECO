from django.urls import re_path
from filemanager.simple_consumer import SimpleFileManagerConsumer

websocket_urlpatterns = [
    re_path(r'ws/filemanager/$', SimpleFileManagerConsumer.as_asgi()),
]
