from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.ai_views import (
    OllamaStatusView,
    TextAnalysisView,
    FileAnalysisView,
    SmartSearchView,
    AnalysisHistoryView,
    GenerateTextView
)

app_name = 'ai_integration'

urlpatterns = [
    # Ollama status and management
    path('ollama/status/', OllamaStatusView.as_view(), name='ollama-status'),
    
    # Text analysis
    path('analyze/text/', TextAnalysisView.as_view(), name='analyze-text'),
    path('analyze/file/', FileAnalysisView.as_view(), name='analyze-file'),
    
    # Smart search
    path('search/smart/', SmartSearchView.as_view(), name='smart-search'),
    
    # History and management
    path('history/', AnalysisHistoryView.as_view(), name='analysis-history'),
    
    # Text generation
    path('generate/', GenerateTextView.as_view(), name='generate-text'),
]
