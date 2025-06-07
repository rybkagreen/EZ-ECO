import os
import json
import hashlib
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models import Q, Count, Sum, F
from celery import shared_task

from archive.models import (
    ArchivedDocument, ArchiveCategory, ArchiveActivity,
    AutoArchivingRule, ArchivingJob, DocumentEmbedding,
    AIAnalysisResult, ArchiveAnalytics
)
from filemanager.models import FileItem
from ai_integration.services.ollama_service import OllamaService

logger = logging.getLogger(__name__)


class DocumentCategorizer:
    """Сервис автоматической категоризации документов"""
    
    def __init__(self):
        self.ai_service = OllamaService()
        
    def analyze_document_content(self, file_item: FileItem) -> Dict[str, Any]:
        """Анализирует содержимое документа для категоризации"""
        try:
            analysis = {}
            
            # Базовый анализ по расширению и MIME типу
            analysis['file_extension'] = file_item.extension
            analysis['mime_type'] = file_item.mime_type
            analysis['size'] = file_item.size
            
            # ИИ анализ содержимого (если файл текстовый)
            if file_item.is_text or file_item.is_code:
                try:
                    file_path = file_item.get_absolute_path()
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()[:5000]  # Первые 5000 символов
                        
                        # ИИ анализ содержимого
                        ai_analysis = self.ai_service.analyze_text(content)
                        analysis['ai_analysis'] = ai_analysis
                        analysis['content_preview'] = content[:500]
                        
                except Exception as e:
                    logger.warning(f"Could not analyze content for {file_item.name}: {e}")
            
            # Анализ названия файла
            analysis['filename_keywords'] = self._extract_filename_keywords(file_item.name)
            
            # Анализ пути файла
            analysis['path_keywords'] = self._extract_path_keywords(file_item.path)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing document {file_item.name}: {e}")
            return {}
    
    def _extract_filename_keywords(self, filename: str) -> List[str]:
        """Извлекает ключевые слова из имени файла"""
        keywords = []
        
        # Убираем расширение и разбиваем по разделителям
        name_without_ext = os.path.splitext(filename)[0]
        parts = name_without_ext.lower().replace('_', ' ').replace('-', ' ').split()
        
        # Словарь ключевых слов для категоризации
        keyword_patterns = {
            'contract': ['договор', 'контракт', 'agreement', 'contract'],
            'invoice': ['счет', 'invoice', 'bill', 'payment'],
            'report': ['отчет', 'report', 'анализ', 'analysis'],
            'project': ['проект', 'project', 'план', 'plan'],
            'technical': ['техническ', 'technical', 'spec', 'документация'],
            'financial': ['финанс', 'financial', 'бюджет', 'budget'],
            'legal': ['правов', 'legal', 'юридическ', 'law'],
            'hr': ['кадр', 'hr', 'персонал', 'employee', 'сотрудник'],
        }
        
        for category, patterns in keyword_patterns.items():
            for pattern in patterns:
                if any(pattern in part for part in parts):
                    keywords.append(category)
                    break
        
        return list(set(keywords))
    
    def _extract_path_keywords(self, path: str) -> List[str]:
        """Извлекает ключевые слова из пути файла"""
        keywords = []
        path_parts = path.lower().split('/')
        
        # Паттерны для путей
        path_patterns = {
            'contracts': ['contract', 'договор', 'agreement'],
            'projects': ['project', 'проект', 'proj'],
            'finance': ['finance', 'финанс', 'accounting', 'бухгалтер'],
            'hr': ['hr', 'кадр', 'personnel', 'персонал'],
            'technical': ['tech', 'техн', 'documentation', 'docs'],
            'archive': ['archive', 'архив', 'old', 'backup'],
        }
        
        for category, patterns in path_patterns.items():
            for pattern in patterns:
                if any(pattern in part for part in path_parts):
                    keywords.append(category)
                    break
        
        return list(set(keywords))
    
    def determine_category(self, analysis: Dict[str, Any]) -> Optional[ArchiveCategory]:
        """Определяет подходящую категорию на основе анализа"""
        try:
            # Получаем все активные категории с правилами автокатегоризации
            categories = ArchiveCategory.objects.filter(
                is_active=True, 
                auto_categorize=True
            ).prefetch_related('retention_policy')
            
            best_match = None
            best_score = 0
            
            for category in categories:
                score = self._calculate_category_score(category, analysis)
                if score > best_score:
                    best_score = score
                    best_match = category
            
            # Возвращаем категорию только если уверенность достаточно высока
            if best_score > 0.3:  # Минимальный порог уверенности
                return best_match
            
            # Если не нашли подходящую категорию, возвращаем категорию по умолчанию
            return ArchiveCategory.objects.filter(
                name__icontains='general',
                is_active=True
            ).first() or ArchiveCategory.objects.filter(is_active=True).first()
            
        except Exception as e:
            logger.error(f"Error determining category: {e}")
            return None
    
    def _calculate_category_score(self, category: ArchiveCategory, analysis: Dict[str, Any]) -> float:
        """Вычисляет оценку соответствия категории документу"""
        score = 0.0
        rules = category.auto_rules
        
        if not rules:
            return 0.0
        
        # Проверяем правила по расширению файла
        if 'file_extensions' in rules:
            if analysis.get('file_extension', '').lower() in rules['file_extensions']:
                score += 0.3
        
        # Проверяем правила по MIME типу
        if 'mime_types' in rules:
            if analysis.get('mime_type', '') in rules['mime_types']:
                score += 0.2
        
        # Проверяем ключевые слова в имени файла
        if 'filename_keywords' in rules:
            filename_keywords = analysis.get('filename_keywords', [])
            matching_keywords = set(filename_keywords) & set(rules['filename_keywords'])
            if matching_keywords:
                score += 0.3 * (len(matching_keywords) / len(rules['filename_keywords']))
        
        # Проверяем ключевые слова в пути
        if 'path_keywords' in rules:
            path_keywords = analysis.get('path_keywords', [])
            matching_keywords = set(path_keywords) & set(rules['path_keywords'])
            if matching_keywords:
                score += 0.2 * (len(matching_keywords) / len(rules['path_keywords']))
        
        # Проверяем размер файла
        if 'size_range' in rules:
            size = analysis.get('size', 0)
            min_size = rules['size_range'].get('min', 0)
            max_size = rules['size_range'].get('max', float('inf'))
            if min_size <= size <= max_size:
                score += 0.1
        
        return min(score, 1.0)  # Максимальная оценка 1.0


class AutoArchiver:
    """Сервис автоматического архивирования документов"""
    
    def __init__(self):
        self.categorizer = DocumentCategorizer()
    
    @transaction.atomic
    def archive_document(
        self, 
        file_item: FileItem, 
        user: User, 
        category: Optional[ArchiveCategory] = None,
        note: str = ""
    ) -> ArchivedDocument:
        """Архивирует документ"""
        try:
            # Проверяем, не архивирован ли уже документ
            if hasattr(file_item, 'archive_record'):
                raise ValueError(f"Document {file_item.name} is already archived")
            
            # Анализируем документ
            analysis = self.categorizer.analyze_document_content(file_item)
            
            # Определяем категорию, если не указана
            if not category:
                category = self.categorizer.determine_category(analysis)
                if not category:
                    raise ValueError("Could not determine suitable category for document")
            
            # Вычисляем checksum файла
            checksum = self._calculate_checksum(file_item)
            
            # Создаем запись архива
            archived_doc = ArchivedDocument.objects.create(
                original_file=file_item,
                category=category,
                archived_by=user,
                metadata=analysis,
                ai_analysis=analysis.get('ai_analysis', {}),
                tags=analysis.get('filename_keywords', []) + analysis.get('path_keywords', []),
                checksum=checksum,
                archive_note=note,
                access_level=category.default_access_level,
                status='archived'
            )
            
            # Логируем активность
            ArchiveActivity.objects.create(
                document=archived_doc,
                user=user,
                activity_type='archived',
                description=f"Document archived to category: {category.name}",
                metadata={'analysis_score': 'auto', 'category_id': category.id}
            )
            
            logger.info(f"Document {file_item.name} archived successfully to {category.name}")
            return archived_doc
            
        except Exception as e:
            logger.error(f"Error archiving document {file_item.name}: {e}")
            raise
    
    def _calculate_checksum(self, file_item: FileItem) -> str:
        """Вычисляет SHA-256 checksum файла"""
        try:
            file_path = file_item.get_absolute_path()
            if not os.path.exists(file_path):
                return ""
            
            sha256_hash = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(chunk)
            
            return sha256_hash.hexdigest()
            
        except Exception as e:
            logger.warning(f"Could not calculate checksum for {file_item.name}: {e}")
            return ""
    
    def process_bulk_archiving(self, file_items: List[FileItem], user: User) -> Dict[str, Any]:
        """Обрабатывает пакетное архивирование файлов"""
        results = {
            'success': [],
            'errors': [],
            'total': len(file_items)
        }
        
        for file_item in file_items:
            try:
                archived_doc = self.archive_document(file_item, user)
                results['success'].append({
                    'file_id': file_item.id,
                    'file_name': file_item.name,
                    'archive_id': archived_doc.id,
                    'category': archived_doc.category.name
                })
            except Exception as e:
                results['errors'].append({
                    'file_id': file_item.id,
                    'file_name': file_item.name,
                    'error': str(e)
                })
        
        return results
    
    def check_archiving_eligibility(self, file_item: FileItem) -> Dict[str, Any]:
        """Проверяет, подходит ли файл для архивирования"""
        result = {
            'eligible': True,
            'reasons': [],
            'suggested_category': None,
            'confidence': 0.0
        }
        
        try:
            # Проверяем, не архивирован ли уже
            if hasattr(file_item, 'archive_record'):
                result['eligible'] = False
                result['reasons'].append('Document is already archived')
                return result
            
            # Проверяем размер файла
            if file_item.size > settings.MAX_ARCHIVE_FILE_SIZE:
                result['eligible'] = False
                result['reasons'].append(f'File size exceeds maximum allowed ({settings.MAX_ARCHIVE_FILE_SIZE} bytes)')
            
            # Анализируем документ
            analysis = self.categorizer.analyze_document_content(file_item)
            category = self.categorizer.determine_category(analysis)
            
            if category:
                result['suggested_category'] = {
                    'id': category.id,
                    'name': category.name,
                    'path': category.full_path
                }
                result['confidence'] = 0.8  # Базовая уверенность
            else:
                result['reasons'].append('Could not determine suitable category')
                result['confidence'] = 0.2
            
        except Exception as e:
            result['eligible'] = False
            result['reasons'].append(f'Error analyzing document: {str(e)}')
        
        return result


class ArchiveManager:
    """Основной менеджер для работы с архивом"""
    
    def __init__(self):
        self.auto_archiver = AutoArchiver()
    
    def restore_document(self, archived_doc: ArchivedDocument, user: User) -> bool:
        """Восстанавливает документ из архива"""
        try:
            with transaction.atomic():
                # Меняем статус
                archived_doc.status = 'restored'
                archived_doc.save()
                
                # Логируем активность
                ArchiveActivity.objects.create(
                    document=archived_doc,
                    user=user,
                    activity_type='restored',
                    description="Document restored from archive"
                )
                
                logger.info(f"Document {archived_doc.original_file.name} restored by {user.username}")
                return True
                
        except Exception as e:
            logger.error(f"Error restoring document {archived_doc.id}: {e}")
            return False
    
    def move_to_category(self, archived_doc: ArchivedDocument, new_category: ArchiveCategory, user: User) -> bool:
        """Перемещает документ в другую категорию"""
        try:
            old_category = archived_doc.category
            
            with transaction.atomic():
                archived_doc.category = new_category
                archived_doc.access_level = new_category.default_access_level
                
                # Пересчитываем дату хранения
                if new_category.retention_policy:
                    archived_doc.retention_date = new_category.retention_policy.calculate_retention_date(
                        archived_doc.archived_at
                    )
                
                archived_doc.save()
                
                # Логируем активность
                ArchiveActivity.objects.create(
                    document=archived_doc,
                    user=user,
                    activity_type='category_changed',
                    description=f"Category changed from {old_category.name} to {new_category.name}",
                    metadata={
                        'old_category_id': old_category.id,
                        'new_category_id': new_category.id
                    }
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Error moving document to category: {e}")
            return False
    
    def update_metadata(self, archived_doc: ArchivedDocument, metadata: Dict[str, Any], user: User) -> bool:
        """Обновляет метаданные документа"""
        try:
            old_metadata = archived_doc.metadata.copy()
            
            with transaction.atomic():
                archived_doc.metadata.update(metadata)
                archived_doc.save()
                
                # Логируем активность
                ArchiveActivity.objects.create(
                    document=archived_doc,
                    user=user,
                    activity_type='metadata_updated',
                    description="Document metadata updated",
                    metadata={
                        'old_metadata': old_metadata,
                        'new_metadata': archived_doc.metadata
                    }
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Error updating metadata: {e}")
            return False
    
    def get_archive_statistics(self) -> Dict[str, Any]:
        """Получает статистику архива"""
        try:
            stats = {
                'total_documents': ArchivedDocument.objects.count(),
                'by_status': {},
                'by_category': {},
                'by_access_level': {},
                'expiring_soon': 0,
                'expired': 0,
                'total_size': 0
            }
            
            # Статистика по статусам
            for status, _ in ArchivedDocument.STATUS_CHOICES:
                count = ArchivedDocument.objects.filter(status=status).count()
                stats['by_status'][status] = count
            
            # Статистика по категориям
            categories = ArchiveCategory.objects.filter(is_active=True)
            for category in categories:
                count = ArchivedDocument.objects.filter(category=category).count()
                stats['by_category'][category.name] = count
            
            # Статистика по уровням доступа
            for level, _ in ArchivedDocument.ACCESS_LEVELS:
                count = ArchivedDocument.objects.filter(access_level=level).count()
                stats['by_access_level'][level] = count
            
            # Истекающие документы (в течение 30 дней)
            soon_date = timezone.now() + timezone.timedelta(days=30)
            stats['expiring_soon'] = ArchivedDocument.objects.filter(
                retention_date__lte=soon_date,
                retention_date__gt=timezone.now(),
                status='archived'
            ).count()
            
            # Истекшие документы
            stats['expired'] = ArchivedDocument.objects.filter(
                retention_date__lt=timezone.now(),
                status='archived'
            ).count()
            
            # Общий размер архива
            total_size = sum(
                doc.original_file.size for doc in ArchivedDocument.objects.select_related('original_file')
                if doc.original_file.size
            )
            stats['total_size_bytes'] = total_size
            stats['total_size_mb'] = total_size / (1024 * 1024) if total_size else 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Error generating archive statistics: {str(e)}")
            return {}


class AutoArchivingService:
    """Сервис автоматического архивирования файлов"""
    
    def __init__(self):
        self.ai_service = OllamaService()
    
    async def process_auto_archiving_rules(self):
        """Обработка всех активных правил автоархивирования"""
        active_rules = AutoArchivingRule.objects.filter(
            status='active',
            schedule_enabled=True,
            next_run__lte=timezone.now()
        )
        
        for rule in active_rules:
            try:
                await self.execute_archiving_rule(rule)
                rule.last_run = timezone.now()
                rule.next_run = self.calculate_next_run(rule)
                rule.success_count += 1
                rule.save()
                
            except Exception as e:
                logger.error(f"Error executing archiving rule {rule.name}: {str(e)}")
                rule.error_count += 1
                rule.save()
    
    async def execute_archiving_rule(self, rule: AutoArchivingRule):
        """Выполнение конкретного правила архивирования"""
        logger.info(f"Executing archiving rule: {rule.name}")
        
        # Найти файлы, подходящие под правило
        candidate_files = await self.find_candidate_files(rule)
        
        if not candidate_files:
            logger.info(f"No candidate files found for rule {rule.name}")
            return
        
        # Создать задание архивирования
        job = ArchivingJob.objects.create(
            auto_rule=rule,
            job_type='auto_rule',
            source_paths=[str(f.full_path) for f in candidate_files],
            target_category=rule.target_category,
            configuration=rule.trigger_conditions,
            total_files=len(candidate_files),
            created_by=rule.created_by
        )
        
        # Выполнить архивирование
        await self.process_archiving_job(job)
    
    async def find_candidate_files(self, rule: AutoArchivingRule) -> List[FileItem]:
        """Поиск файлов-кандидатов для архивирования"""
        query = Q()
        
        # Фильтр по шаблонам имен файлов
        if rule.file_patterns:
            pattern_query = Q()
            for pattern in rule.file_patterns:
                pattern_query |= Q(name__iregex=pattern)
            query &= pattern_query
        
        # Исключения
        if rule.exclude_patterns:
            exclude_query = Q()
            for pattern in rule.exclude_patterns:
                exclude_query |= Q(name__iregex=pattern)
            query &= ~exclude_query
        
        # Условия по типу триггера
        trigger_conditions = rule.trigger_conditions
        
        if rule.trigger_type == 'time_based':
            days_old = trigger_conditions.get('days_old', 30)
            cutoff_date = timezone.now() - timedelta(days=days_old)
            query &= Q(created_at__lt=cutoff_date)
        
        elif rule.trigger_type == 'size_based':
            max_size = trigger_conditions.get('max_size_mb', 100) * 1024 * 1024
            query &= Q(size__gte=max_size)
        
        elif rule.trigger_type == 'user_activity':
            days_inactive = trigger_conditions.get('days_inactive', 60)
            cutoff_date = timezone.now() - timedelta(days=days_inactive)
            query &= Q(last_accessed__lt=cutoff_date)
        
        # Исключить уже архивированные файлы
        query &= ~Q(archive_record__isnull=False)
        
        return list(FileItem.objects.filter(query)[:1000])  # Лимит на обработку
    
    async def process_archiving_job(self, job: ArchivingJob):
        """Обработка задания архивирования"""
        job.status = 'running'
        job.started_at = timezone.now()
        job.save()
        
        try:
            source_paths = job.source_paths
            
            for file_path in source_paths:
                try:
                    file_item = FileItem.objects.get(full_path=file_path)
                    success = await self.archive_single_file(
                        file_item, 
                        job.target_category,
                        job.configuration.get('require_ai_analysis', True)
                    )
                    
                    if success:
                        job.update_progress(processed=1, successful=1)
                    else:
                        job.update_progress(processed=1, failed=1)
                        
                except FileItem.DoesNotExist:
                    job.error_log.append(f"File not found: {file_path}")
                    job.update_progress(processed=1, failed=1)
                
                except Exception as e:
                    job.error_log.append(f"Error processing {file_path}: {str(e)}")
                    job.update_progress(processed=1, failed=1)
            
            job.status = 'completed'
            
        except Exception as e:
            job.status = 'failed'
            job.error_log.append(f"Job failed: {str(e)}")
            
        finally:
            job.completed_at = timezone.now()
            job.save()
    
    async def archive_single_file(self, file_item: FileItem, category: ArchiveCategory, ai_analysis: bool = True) -> bool:
        """Архивирование одного файла"""
        try:
            # Вычислить checksum
            checksum = self.calculate_file_checksum(file_item.full_path)
            
            # Создать архивную запись
            archived_doc = ArchivedDocument.objects.create(
                original_file=file_item,
                category=category,
                archived_by=file_item.owner,
                status='processing',
                checksum=checksum,
                metadata={
                    'original_size': file_item.size,
                    'original_path': str(file_item.full_path),
                    'archived_by_rule': True
                }
            )
            
            # ИИ анализ если требуется
            if ai_analysis:
                await self.perform_ai_analysis(archived_doc)
            
            # Создать векторное представление
            await self.create_document_embedding(archived_doc)
            
            archived_doc.status = 'archived'
            archived_doc.save()
            
            logger.info(f"Successfully archived file: {file_item.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to archive file {file_item.name}: {str(e)}")
            return False
    
    async def perform_ai_analysis(self, document: ArchivedDocument):
        """Выполнение ИИ анализа документа"""
        try:
            file_path = document.original_file.full_path
            
            # Классификация контента через Ollama
            classification_result = await self.ai_service.classify_document_content(str(file_path))
            AIAnalysisResult.objects.create(
                document=document,
                analysis_type='content_classification',
                ai_model='ollama_llama2',
                results=classification_result,
                confidence_score=classification_result.get('confidence', 0.0),
                classifications=classification_result.get('categories', []),
                processing_time=classification_result.get('processing_time', 0.0)
            )
            
            # Извлечение ключевых слов
            keywords_result = await self.ai_service.extract_keywords(str(file_path))
            AIAnalysisResult.objects.create(
                document=document,
                analysis_type='entity_extraction',
                ai_model='ollama_llama2',
                results=keywords_result,
                confidence_score=keywords_result.get('confidence', 0.0),
                extracted_entities=keywords_result.get('keywords', []),
                processing_time=keywords_result.get('processing_time', 0.0)
            )
            
        except Exception as e:
            logger.error(f"AI analysis failed for document {document.id}: {str(e)}")
    
    async def create_document_embedding(self, document: ArchivedDocument):
        """Создание векторного представления документа"""
        try:
            file_path = document.original_file.full_path
            
            # Получить embedding контента через ИИ сервис
            content_text = await self.ai_service.extract_text_content(str(file_path))
            content_embedding = await self.ai_service.get_text_embedding(content_text)
            
            # Получить embedding метаданных
            metadata_text = json.dumps(document.metadata)
            metadata_embedding = await self.ai_service.get_text_embedding(metadata_text)
            
            # Извлечь ключевые слова
            keywords = await self.ai_service.extract_keywords(str(file_path))
            
            DocumentEmbedding.objects.create(
                document=document,
                content_embedding=content_embedding,
                metadata_embedding=metadata_embedding,
                keywords=keywords.get('keywords', []) if isinstance(keywords, dict) else keywords,
                embedding_model='ollama-embeddings'
            )
            
        except Exception as e:
            logger.error(f"Failed to create embedding for document {document.id}: {str(e)}")
    
    def calculate_file_checksum(self, file_path: str) -> str:
        """Вычисление SHA-256 checksum файла"""
        hash_sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logger.error(f"Failed to calculate checksum for {file_path}: {str(e)}")
            return ""
    
    def calculate_next_run(self, rule: AutoArchivingRule) -> datetime:
        """Вычисление времени следующего запуска правила"""
        # Простая реализация - каждые 24 часа
        return timezone.now() + timedelta(hours=24)


class ArchiveSearchService:
    """Сервис поиска в архиве с ИИ поддержкой"""
    
    def __init__(self):
        self.ai_service = OllamaService()
    
    async def semantic_search(self, query: str, user: User, limit: int = 20) -> List[Dict]:
        """Семантический поиск по архиву"""
        try:
            # Получить embedding запроса
            query_embedding = await self.ai_service.get_text_embedding(query)
            
            # Найти похожие документы
            similar_docs = await self.find_similar_documents(query_embedding, user, limit)
            
            return similar_docs
            
        except Exception as e:
            logger.error(f"Semantic search failed: {str(e)}")
            return []
    
    async def find_similar_documents(self, query_embedding: List[float], user: User, limit: int) -> List[Dict]:
        """Поиск похожих документов по embedding"""
        # Получить все embeddings с правами доступа
        embeddings = DocumentEmbedding.objects.select_related('document').filter(
            document__status='archived'
        )
        
        similarities = []
        for embedding in embeddings:
            # Проверить права доступа
            if not self.check_document_access(embedding.document, user):
                continue
            
            # Вычислить косинусное сходство
            similarity = self.cosine_similarity(query_embedding, embedding.content_embedding)
            
            if similarity > 0.3:  # Порог сходства
                similarities.append({
                    'document': embedding.document,
                    'similarity': similarity,
                    'keywords': embedding.keywords[:5]  # Топ 5 ключевых слов
                })
        
        # Сортировать по сходству
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        return similarities[:limit]
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Вычисление косинусного сходства между векторами"""
        import math
        
        try:
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            magnitude_a = math.sqrt(sum(a * a for a in vec1))
            magnitude_b = math.sqrt(sum(b * b for b in vec2))
            
            if magnitude_a * magnitude_b == 0:
                return 0
            
            return dot_product / (magnitude_a * magnitude_b)
        except:
            return 0
    
    def check_document_access(self, document: ArchivedDocument, user: User) -> bool:
        """Проверка прав доступа к документу"""
        # Проверить уровень доступа
        if document.access_level == 'public':
            return True
        
        if document.access_level == 'internal' and user.is_authenticated:
            return True
        
        # Проверить владельца
        if document.archived_by == user:
            return True
        
        # Проверить специальные разрешения
        return document.permissions.filter(
            user=user,
            permission_type='view'
        ).exists()


class ArchiveAnalyticsService:
    """Сервис аналитики архива"""
    
    def calculate_daily_metrics(self, date: datetime.date = None):
        """Вычисление дневных метрик"""
        if not date:
            date = timezone.now().date()
        
        # Использование хранилища
        storage_data = self.calculate_storage_metrics(date)
        ArchiveAnalytics.objects.update_or_create(
            metric_type='storage_usage',
            metric_date=date,
            defaults={
                'metric_data': storage_data,
                'total_count': storage_data['total_documents'],
                'total_size': storage_data['total_size_bytes']
            }
        )
        
        # Скорость архивирования
        archive_rate_data = self.calculate_archive_rate(date)
        ArchiveAnalytics.objects.update_or_create(
            metric_type='archive_rate',
            metric_date=date,
            defaults={
                'metric_data': archive_rate_data,
                'total_count': archive_rate_data['documents_archived']
            }
        )
        
        # Распределение по категориям
        category_data = self.calculate_category_distribution(date)
        for category_id, data in category_data.items():
            ArchiveAnalytics.objects.update_or_create(
                metric_type='category_distribution',
                metric_date=date,
                category_id=category_id,
                defaults={
                    'metric_data': data,
                    'total_count': data['document_count'],
                    'total_size': data['total_size']
                }
            )
    
    def calculate_storage_metrics(self, date: datetime.date) -> Dict:
        """Метрики использования хранилища"""
        queryset = ArchivedDocument.objects.filter(
            archived_at__date=date,
            status='archived'
        )
        
        total_docs = queryset.count()
        total_size = queryset.aggregate(
            total=Sum('original_file__size')
        )['total'] or 0
        
        return {
            'total_documents': total_docs,
            'total_size_bytes': total_size,
            'total_size_mb': total_size / (1024 * 1024),
            'average_size_bytes': total_size / total_docs if total_docs > 0 else 0
        }
    
    def calculate_archive_rate(self, date: datetime.date) -> Dict:
        """Метрики скорости архивирования"""
        archived_count = ArchivedDocument.objects.filter(
            archived_at__date=date
        ).count()
        
        jobs_completed = ArchivingJob.objects.filter(
            completed_at__date=date,
            status='completed'
        ).count()
        
        return {
            'documents_archived': archived_count,
            'jobs_completed': jobs_completed,
            'average_per_job': archived_count / jobs_completed if jobs_completed > 0 else 0
        }
    
    def calculate_category_distribution(self, date: datetime.date) -> Dict:
        """Распределение документов по категориям"""
        categories = ArchiveCategory.objects.annotate(
            doc_count=Count('documents'),
            total_size=Sum('documents__original_file__size')
        ).filter(documents__archived_at__date=date)
        
        result = {}
        for category in categories:
            result[category.id] = {
                'category_name': category.name,
                'document_count': category.doc_count,
                'total_size': category.total_size or 0
            }
        
        return result


# Celery задачи для фонового выполнения
@shared_task
def process_auto_archiving():
    """Celery задача для обработки автоархивирования"""
    service = AutoArchivingService()
    import asyncio
    asyncio.run(service.process_auto_archiving_rules())


@shared_task
def calculate_analytics(date_str: str = None):
    """Celery задача для вычисления аналитики"""
    service = ArchiveAnalyticsService()
    if date_str:
        from datetime import datetime
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        date = timezone.now().date()
    
    service.calculate_daily_metrics(date)


@shared_task
def cleanup_expired_documents():
    """Celery задача для очистки истекших документов"""
    expired_docs = ArchivedDocument.objects.filter(
        retention_date__lt=timezone.now(),
        status='archived'
    )
    
    for doc in expired_docs:
        # Проверить политику автоудаления
        if doc.category.retention_policy.auto_delete:
            doc.status = 'scheduled_deletion'
            doc.save()
            logger.info(f"Scheduled for deletion: {doc.original_file.name}")
        else:
            doc.status = 'expired'
            doc.save()
            logger.info(f"Marked as expired: {doc.original_file.name}")
