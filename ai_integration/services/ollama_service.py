import httpx
import logging
from django.conf import settings
from celery import shared_task
import json
from typing import Optional, Dict, Any, List
import asyncio

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = getattr(settings, 'OLLAMA_DEFAULT_MODEL', 'llama3.2:1b')
        self.timeout = 30.0
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def check_connection(self) -> bool:
        """Проверка подключения к Ollama"""
        try:
            url = f"{self.base_url}/api/tags"
            response = await self.client.get(url)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            return False

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Получить список доступных моделей"""
        try:
            url = f"{self.base_url}/api/tags"
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            return data.get('models', [])
        except Exception as e:
            logger.error(f"Error fetching models: {e}")
            return []

    async def generate(self, prompt: str, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Генерация текста с помощью модели"""
        if not await self.check_connection():
            logger.error("Ollama service is not available")
            return None
            
        url = f"{self.base_url}/api/generate"
        data = {
            "model": model or self.default_model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = await self.client.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error generating text: {e}")
            return None

    def sync_generate(self, prompt: str, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Синхронная версия генерации текста"""
        try:
            return asyncio.run(self.generate(prompt, model))
        except Exception as e:
            logger.error(f"Error in sync generate: {e}")
            return None

    def sync_check_connection(self) -> bool:
        """Синхронная проверка подключения"""
        try:
            return asyncio.run(self.check_connection())
        except Exception as e:
            logger.error(f"Error in sync check_connection: {e}")
            return False

    def sync_get_available_models(self) -> List[Dict[str, Any]]:
        """Синхронная версия получения списка моделей"""
        try:
            return asyncio.run(self.get_available_models())
        except Exception as e:
            logger.error(f"Error in sync get_available_models: {e}")
            return []


# Глобальный экземпляр сервиса
_ollama_service = None

def get_ollama_service() -> OllamaService:
    """Получить глобальный экземпляр OllamaService"""
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
