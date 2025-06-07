"""
Management команда для создания тестовых данных архива.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from archive.models import (
    RetentionPolicy, ArchiveCategory, ArchivedDocument, 
    AutoArchivingRule, ComplianceRule, ArchiveAnalytics
)


class Command(BaseCommand):
    help = 'Создает тестовые данные для архивной системы'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Создание тестовых данных архива...'))
        
        # Создание политик хранения
        retention_policies = [
            {'name': '7 лет', 'retention_period': 7, 'period_type': 'years', 'auto_delete': False},
            {'name': '3 года', 'retention_period': 3, 'period_type': 'years', 'auto_delete': True},
            {'name': '1 год', 'retention_period': 1, 'period_type': 'years', 'auto_delete': True},
            {'name': '6 месяцев', 'retention_period': 6, 'period_type': 'months', 'auto_delete': True},
            {'name': 'Постоянно', 'retention_period': 0, 'period_type': 'permanent', 'auto_delete': False},
        ]
        
        for policy_data in retention_policies:
            policy, created = RetentionPolicy.objects.get_or_create(
                name=policy_data['name'],
                defaults=policy_data
            )
            if created:
                self.stdout.write(f'  Создана политика хранения: {policy.name}')
        
        # Создание категорий архива
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        
        seven_year_policy = RetentionPolicy.objects.get(name='7 лет')
        three_year_policy = RetentionPolicy.objects.get(name='3 года')
        one_year_policy = RetentionPolicy.objects.get(name='1 год')
        
        categories_data = [
            {
                'name': 'Финансовые документы',
                'description': 'Бухгалтерские документы, отчеты, счета',
                'retention_policy': seven_year_policy,
                'default_access_level': 'confidential',
                'requires_approval': True,
            },
            {
                'name': 'Договоры и соглашения',
                'description': 'Юридические документы, контракты',
                'retention_policy': seven_year_policy,
                'default_access_level': 'restricted',
                'requires_approval': True,
            },
            {
                'name': 'Техническая документация',
                'description': 'Техническая документация, спецификации',
                'retention_policy': three_year_policy,
                'default_access_level': 'internal',
                'requires_approval': False,
            },
            {
                'name': 'Переписка',
                'description': 'Деловая переписка, служебные записки',
                'retention_policy': one_year_policy,
                'default_access_level': 'internal',
                'requires_approval': False,
            },
        ]
        
        for category_data in categories_data:
            category, created = ArchiveCategory.objects.get_or_create(
                name=category_data['name'],
                defaults={**category_data, 'created_by': admin_user}
            )
            if created:
                self.stdout.write(f'  Создана категория: {category.name}')
        
        # Создание правил соответствия
        financial_category = ArchiveCategory.objects.get(name='Финансовые документы')
        contract_category = ArchiveCategory.objects.get(name='Договоры и соглашения')
        
        compliance_rules = [
            {
                'name': 'GDPR - Персональные данные',
                'rule_type': 'gdpr',
                'description': 'Правила обработки персональных данных согласно GDPR',
                'required_retention_period': 7 * 365,  # дни
                'requires_encryption': True,
                'requires_audit_log': True,
                'auto_delete_required': True,
                'effective_date': timezone.now().date(),
                'categories': [financial_category, contract_category],
            },
            {
                'name': 'Налоговое законодательство РФ',
                'rule_type': 'custom',
                'description': 'Требования налогового законодательства РФ к хранению документов',
                'required_retention_period': 5 * 365,  # дни
                'requires_encryption': False,
                'requires_audit_log': True,
                'auto_delete_required': False,
                'effective_date': timezone.now().date(),
                'categories': [financial_category],
            },
        ]
        
        for rule_data in compliance_rules:
            categories = rule_data.pop('categories', [])
            rule, created = ComplianceRule.objects.get_or_create(
                name=rule_data['name'],
                defaults=rule_data
            )
            if created:
                rule.categories.set(categories)
                self.stdout.write(f'  Создано правило соответствия: {rule.name}')
        
        # Создание автоправил архивирования
        auto_rules_data = [
            {
                'name': 'Автоархивирование счетов',
                'description': 'Автоматическое архивирование документов со словом "счет" в названии',
                'trigger_type': 'pattern_based',
                'trigger_conditions': {
                    'file_name_contains': ['счет', 'invoice', 'bill'],
                    'min_age_days': 30
                },
                'target_category': financial_category,
                'file_patterns': ['*.pdf', '*.doc', '*.docx'],
                'schedule_cron': '0 2 * * *',  # Каждый день в 2:00
                'created_by': admin_user,
            },
            {
                'name': 'Архивирование старых файлов',
                'description': 'Архивирование файлов старше 1 года',
                'trigger_type': 'time_based',
                'trigger_conditions': {
                    'max_age_days': 365,
                    'exclude_recent_access_days': 90
                },
                'target_category': ArchiveCategory.objects.get(name='Техническая документация'),
                'file_patterns': ['*.*'],
                'schedule_cron': '0 1 1 * *',  # Первое число каждого месяца в 1:00
                'created_by': admin_user,
            },
        ]
        
        for rule_data in auto_rules_data:
            rule, created = AutoArchivingRule.objects.get_or_create(
                name=rule_data['name'],
                defaults=rule_data
            )
            if created:
                self.stdout.write(f'  Создано автоправило: {rule.name}')
        
        # Создание тестовых аналитических данных
        analytics_data = [
            {
                'metric_type': 'storage_usage',
                'metric_date': timezone.now().date(),
                'metric_data': {
                    'total_files': 156,
                    'categories': {
                        'Финансовые документы': {'count': 45, 'size_mb': 234.5},
                        'Договоры и соглашения': {'count': 32, 'size_mb': 189.3},
                        'Техническая документация': {'count': 79, 'size_mb': 567.8},
                    }
                },
                'total_count': 156,
                'total_size': 991600000,  # байты
            },
            {
                'metric_type': 'archive_rate',
                'metric_date': timezone.now().date(),
                'metric_data': {
                    'files_per_day': 12,
                    'avg_size_mb': 6.3,
                    'peak_hours': [14, 15, 16],
                },
                'total_count': 12,
                'average_value': 6.3,
            },
        ]
        
        for data in analytics_data:
            analytics, created = ArchiveAnalytics.objects.get_or_create(
                metric_type=data['metric_type'],
                metric_date=data['metric_date'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  Создана аналитика: {analytics.get_metric_type_display()}')
        
        self.stdout.write(
            self.style.SUCCESS('Тестовые данные архива успешно созданы!')
        )
