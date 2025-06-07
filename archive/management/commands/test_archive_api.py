"""
Тестирование API архива.
"""

import requests
import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class Command(BaseCommand):
    help = 'Тестирует API архива'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Тестирование API архива...'))
        
        # Получаем JWT токен для API
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Суперпользователь не найден'))
            return
        
        # Создаем JWT токен
        refresh = RefreshToken.for_user(admin_user)
        access_token = str(refresh.access_token)
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        base_url = 'http://localhost:8000/api/v1/archive'
        
        # Тест 1: Получение политик хранения
        try:
            response = requests.get(f'{base_url}/retention-policies/', headers=headers)
            self.stdout.write(f'Статус политик хранения: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                self.stdout.write(f'Найдено {len(data.get("results", data))} политик хранения')
            else:
                self.stdout.write(f'Ошибка: {response.text}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка запроса политик: {e}'))
        
        # Тест 2: Получение категорий
        try:
            response = requests.get(f'{base_url}/categories/', headers=headers)
            self.stdout.write(f'Статус категорий: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                self.stdout.write(f'Найдено {len(data.get("results", data))} категорий')
            else:
                self.stdout.write(f'Ошибка: {response.text}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка запроса категорий: {e}'))
        
        # Тест 3: Получение автоправил
        try:
            response = requests.get(f'{base_url}/auto-rules/', headers=headers)
            self.stdout.write(f'Статус автоправил: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                self.stdout.write(f'Найдено {len(data.get("results", data))} автоправил')
            else:
                self.stdout.write(f'Ошибка: {response.text}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка запроса автоправил: {e}'))
        
        # Тест 4: Получение аналитики
        try:
            response = requests.get(f'{base_url}/analytics/', headers=headers)
            self.stdout.write(f'Статус аналитики: {response.status_code}')
            if response.status_code == 200:
                data = response.json()
                self.stdout.write(f'Найдено {len(data.get("results", data))} записей аналитики')
            else:
                self.stdout.write(f'Ошибка: {response.text}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка запроса аналитики: {e}'))
        
        self.stdout.write(self.style.SUCCESS('Тестирование API завершено!'))
