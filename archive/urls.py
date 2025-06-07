from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArchivedDocumentViewSet, ArchiveCategoryViewSet, AutoArchivingRuleViewSet,
    ArchivingJobViewSet, ArchiveAnalyticsViewSet, ArchiveActivityViewSet,
    DocumentEmbeddingViewSet, AIAnalysisResultViewSet, RetentionPolicyViewSet,
    ComplianceRuleViewSet, ArchivePermissionViewSet, ArchiveStatsView,
    SemanticSearchView, AnalyticsReportView
)

app_name = 'archive'

# Создаем роутер для ViewSets
router = DefaultRouter()
router.register(r'documents', ArchivedDocumentViewSet, basename='archived-document')
router.register(r'categories', ArchiveCategoryViewSet, basename='archive-category')
router.register(r'rules', AutoArchivingRuleViewSet, basename='archiving-rule')
router.register(r'jobs', ArchivingJobViewSet, basename='archiving-job')
router.register(r'analytics', ArchiveAnalyticsViewSet, basename='archive-analytics')
router.register(r'activities', ArchiveActivityViewSet, basename='archive-activity')
router.register(r'embeddings', DocumentEmbeddingViewSet, basename='document-embedding')
router.register(r'ai-analysis', AIAnalysisResultViewSet, basename='ai-analysis-result')
router.register(r'retention-policies', RetentionPolicyViewSet, basename='retention-policy')
router.register(r'compliance-rules', ComplianceRuleViewSet, basename='compliance-rule')
router.register(r'permissions', ArchivePermissionViewSet, basename='archive-permission')

urlpatterns = [
    # ViewSet URLs
    path('', include(router.urls)),
    
    # Custom API endpoints
    path('stats/', ArchiveStatsView.as_view(), name='archive-stats'),
    path('search/semantic/', SemanticSearchView.as_view(), name='semantic-search'),
    path('reports/generate/', AnalyticsReportView.as_view(), name='generate-report'),
]
