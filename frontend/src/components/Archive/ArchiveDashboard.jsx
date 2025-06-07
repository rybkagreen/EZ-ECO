import React, { useState, useEffect } from 'react';
import { archiveAPI } from '../../services/archiveAPI';

const ArchiveDashboard = () => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSize: 0,
    categoriesCount: 0,
    recentArchived: 0,
    expiringDocuments: 0,
    aiAnalysisCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, activityData] = await Promise.all([
        archiveAPI.getStats(),
        archiveAPI.getRecentActivity()
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  if (isLoading) {
    return (
      <div className="archive-loading">
        <div className="archive-spinner"></div>
        Загрузка дашборда...
      </div>
    );
  }

  return (
    <div className="archive-dashboard">
      <h2 className="dashboard-title">Обзор Архива</h2>
      
      {/* Статистические карточки */}
      <div className="archive-stats-grid">
        <div className="archive-stat-card">
          <div className="archive-stat-value">{stats.totalDocuments}</div>
          <div className="archive-stat-label">Всего документов</div>
        </div>
        
        <div className="archive-stat-card">
          <div className="archive-stat-value">{formatFileSize(stats.totalSize)}</div>
          <div className="archive-stat-label">Объем архива</div>
        </div>
        
        <div className="archive-stat-card">
          <div className="archive-stat-value">{stats.categoriesCount}</div>
          <div className="archive-stat-label">Категорий</div>
        </div>
        
        <div className="archive-stat-card">
          <div className="archive-stat-value">{stats.recentArchived}</div>
          <div className="archive-stat-label">За последние 24ч</div>
        </div>
        
        <div className="archive-stat-card">
          <div className="archive-stat-value">{stats.expiringDocuments}</div>
          <div className="archive-stat-label">Истекает скоро</div>
        </div>
        
        <div className="archive-stat-card">
          <div className="archive-stat-value">{stats.aiAnalysisCount}</div>
          <div className="archive-stat-label">ИИ анализов</div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="archive-card">
        <div className="archive-card-header">
          <h3 className="archive-card-title">Быстрые действия</h3>
        </div>
        <div className="quick-actions">
          <button className="archive-btn primary">
            📁 Создать правило архивирования
          </button>
          <button className="archive-btn">
            🔍 Запустить семантический поиск
          </button>
          <button className="archive-btn">
            📊 Создать отчет
          </button>
          <button className="archive-btn">
            ⚙️ Запустить ручное архивирование
          </button>
        </div>
      </div>

      {/* Последняя активность */}
      <div className="archive-card">
        <div className="archive-card-header">
          <h3 className="archive-card-title">Последняя активность</h3>
          <span className="archive-card-badge">Live</span>
        </div>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'archived' && '📁'}
                  {activity.type === 'searched' && '🔍'}
                  {activity.type === 'ai_analysis' && '🤖'}
                  {activity.type === 'expired' && '⏰'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.timestamp}</div>
                </div>
                <div className="activity-status">
                  <span className={`status-badge ${activity.status}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>Нет недавней активности</p>
            </div>
          )}
        </div>
      </div>

      {/* Предупреждения */}
      {stats.expiringDocuments > 0 && (
        <div className="archive-card warning">
          <div className="archive-card-header">
            <h3 className="archive-card-title">⚠️ Требует внимания</h3>
          </div>
          <div className="archive-card-content">
            <p>
              {stats.expiringDocuments} документов истекает в ближайшие 30 дней.
              Рекомендуется проверить политики хранения.
            </p>
            <button className="archive-btn danger">
              Просмотреть документы
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveDashboard;
