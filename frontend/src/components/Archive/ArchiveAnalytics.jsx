import React, { useState, useEffect } from 'react';
import { archiveAPI } from '../../services/archiveAPI';

const ArchiveAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    storageMetrics: {},
    categoryDistribution: [],
    accessPatterns: {},
    retentionCompliance: {},
    aiAccuracy: {}
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('storage');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const [storage, categories, access, retention, accuracy] = await Promise.all([
        archiveAPI.getStorageMetrics(selectedPeriod),
        archiveAPI.getCategoryDistribution(),
        archiveAPI.getAccessPatterns(selectedPeriod),
        archiveAPI.getRetentionCompliance(),
        archiveAPI.getAIAccuracyMetrics()
      ]);

      setAnalyticsData({
        storageMetrics: storage,
        categoryDistribution: categories,
        accessPatterns: access,
        retentionCompliance: retention,
        aiAccuracy: accuracy
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value, total) => {
    if (!total) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const exportReport = async () => {
    try {
      const blob = await archiveAPI.exportAnalyticsReport({
        period: selectedPeriod,
        format: 'pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archive-analytics-${selectedPeriod}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="archive-loading">
        <div className="archive-spinner"></div>
        Загрузка аналитики...
      </div>
    );
  }

  return (
    <div className="archive-analytics">
      <div className="analytics-header">
        <h2 className="dashboard-title">Аналитика и отчетность</h2>
        
        <div className="analytics-controls">
          <select 
            className="archive-input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7d">Последние 7 дней</option>
            <option value="30d">Последние 30 дней</option>
            <option value="90d">Последние 3 месяца</option>
            <option value="1y">Последний год</option>
          </select>
          
          <button className="archive-btn primary" onClick={exportReport}>
            📊 Экспорт отчета
          </button>
        </div>
      </div>

      {/* Вкладки аналитики */}
      <div className="analytics-tabs">
        <button 
          className={`archive-nav-item ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          💾 Хранилище
        </button>
        <button 
          className={`archive-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📂 Категории
        </button>
        <button 
          className={`archive-nav-item ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          👁️ Доступ
        </button>
        <button 
          className={`archive-nav-item ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          ✅ Соответствие
        </button>
        <button 
          className={`archive-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 ИИ Метрики
        </button>
      </div>

      {/* Контент вкладок */}
      <div className="analytics-content">
        
        {/* Аналитика хранилища */}
        {activeTab === 'storage' && (
          <div className="storage-analytics">
            <div className="archive-stats-grid">
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {formatFileSize(analyticsData.storageMetrics.totalSize || 0)}
                </div>
                <div className="archive-stat-label">Общий объем</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.storageMetrics.totalDocuments || 0}
                </div>
                <div className="archive-stat-label">Всего документов</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {formatFileSize(analyticsData.storageMetrics.averageFileSize || 0)}
                </div>
                <div className="archive-stat-label">Средний размер</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.storageMetrics.growthRate || 0}%
                </div>
                <div className="archive-stat-label">Рост за период</div>
              </div>
            </div>

            {/* График использования хранилища */}
            <div className="archive-card">
              <div className="archive-card-header">
                <h3 className="archive-card-title">Динамика использования хранилища</h3>
              </div>
              <div className="storage-chart">
                {analyticsData.storageMetrics.dailyUsage?.map((day, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(day.size / analyticsData.storageMetrics.maxDaySize) * 100}%` 
                      }}
                    ></div>
                    <div className="bar-label">{day.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Аналитика по категориям */}
        {activeTab === 'categories' && (
          <div className="categories-analytics">
            <div className="archive-card">
              <div className="archive-card-header">
                <h3 className="archive-card-title">Распределение по категориям</h3>
              </div>
              <div className="category-distribution">
                {analyticsData.categoryDistribution.map((category, index) => (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category.name}</span>
                      <span className="category-stats">
                        {category.documentCount} док. • {formatFileSize(category.totalSize)}
                      </span>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="category-fill"
                        style={{ 
                          width: formatPercentage(
                            category.documentCount, 
                            analyticsData.categoryDistribution.reduce((sum, cat) => sum + cat.documentCount, 0)
                          )
                        }}
                      ></div>
                    </div>
                    <span className="category-percentage">
                      {formatPercentage(
                        category.documentCount,
                        analyticsData.categoryDistribution.reduce((sum, cat) => sum + cat.documentCount, 0)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Аналитика доступа */}
        {activeTab === 'access' && (
          <div className="access-analytics">
            <div className="archive-stats-grid">
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.accessPatterns.totalViews || 0}
                </div>
                <div className="archive-stat-label">Просмотров</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.accessPatterns.totalDownloads || 0}
                </div>
                <div className="archive-stat-label">Скачиваний</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.accessPatterns.uniqueUsers || 0}
                </div>
                <div className="archive-stat-label">Уникальных пользователей</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.accessPatterns.avgAccessTime || 0}с
                </div>
                <div className="archive-stat-label">Среднее время доступа</div>
              </div>
            </div>

            {/* Топ документов */}
            <div className="archive-card">
              <div className="archive-card-header">
                <h3 className="archive-card-title">Популярные документы</h3>
              </div>
              <div className="popular-documents">
                {analyticsData.accessPatterns.topDocuments?.map((doc, index) => (
                  <div key={index} className="popular-doc-item">
                    <span className="doc-rank">#{index + 1}</span>
                    <div className="doc-info">
                      <span className="doc-name">{doc.name}</span>
                      <span className="doc-stats">{doc.views} просмотров</span>
                    </div>
                    <div className="access-progress">
                      <div 
                        className="archive-progress-bar"
                        style={{ 
                          width: formatPercentage(doc.views, analyticsData.accessPatterns.topDocuments[0].views)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Соответствие требованиям */}
        {activeTab === 'compliance' && (
          <div className="compliance-analytics">
            <div className="archive-stats-grid">
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.retentionCompliance.compliantDocuments || 0}
                </div>
                <div className="archive-stat-label">Соответствующих</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.retentionCompliance.expiringDocuments || 0}
                </div>
                <div className="archive-stat-label">Истекают</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.retentionCompliance.overdueDocuments || 0}
                </div>
                <div className="archive-stat-label">Просрочены</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {Math.round(analyticsData.retentionCompliance.complianceRate || 0)}%
                </div>
                <div className="archive-stat-label">Соответствие</div>
              </div>
            </div>

            {/* Проблемы соответствия */}
            <div className="archive-card">
              <div className="archive-card-header">
                <h3 className="archive-card-title">Проблемы соответствия</h3>
              </div>
              <div className="compliance-issues">
                {analyticsData.retentionCompliance.issues?.map((issue, index) => (
                  <div key={index} className={`issue-item ${issue.severity}`}>
                    <div className="issue-icon">
                      {issue.severity === 'high' && '🔴'}
                      {issue.severity === 'medium' && '🟡'}
                      {issue.severity === 'low' && '🟢'}
                    </div>
                    <div className="issue-content">
                      <span className="issue-title">{issue.title}</span>
                      <span className="issue-description">{issue.description}</span>
                    </div>
                    <button className="archive-btn">Исправить</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ИИ Метрики */}
        {activeTab === 'ai' && (
          <div className="ai-analytics">
            <div className="archive-stats-grid">
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {Math.round(analyticsData.aiAccuracy.classificationAccuracy || 0)}%
                </div>
                <div className="archive-stat-label">Точность классификации</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.aiAccuracy.totalAnalyses || 0}
                </div>
                <div className="archive-stat-label">Всего анализов</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {Math.round(analyticsData.aiAccuracy.averageConfidence || 0)}%
                </div>
                <div className="archive-stat-label">Средняя уверенность</div>
              </div>
              
              <div className="archive-stat-card">
                <div className="archive-stat-value">
                  {analyticsData.aiAccuracy.averageProcessingTime || 0}с
                </div>
                <div className="archive-stat-label">Время обработки</div>
              </div>
            </div>

            {/* Производительность ИИ моделей */}
            <div className="archive-card">
              <div className="archive-card-header">
                <h3 className="archive-card-title">Производительность ИИ моделей</h3>
              </div>
              <div className="ai-models-performance">
                {analyticsData.aiAccuracy.modelPerformance?.map((model, index) => (
                  <div key={index} className="model-item">
                    <div className="model-info">
                      <span className="model-name">{model.name}</span>
                      <span className="model-type">{model.type}</span>
                    </div>
                    <div className="model-metrics">
                      <div className="metric">
                        <span className="metric-label">Точность:</span>
                        <span className="metric-value">{model.accuracy}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Скорость:</span>
                        <span className="metric-value">{model.speed}с</span>
                      </div>
                    </div>
                    <div className="model-progress">
                      <div className="archive-progress">
                        <div 
                          className="archive-progress-bar"
                          style={{ width: `${model.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveAnalytics;
