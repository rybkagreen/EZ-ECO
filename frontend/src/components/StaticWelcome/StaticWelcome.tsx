import React from 'react';
import './StaticWelcome.css';
import corporateEmblem from '../../assets/corporate_emblem.jpg';

interface StaticWelcomeProps {
  companyName?: string;
  subtitle?: string;
  onContinue?: () => void;
}

const StaticWelcome: React.FC<StaticWelcomeProps> = ({
  companyName = "ЕДИНЫЙ ЗАКАЗЧИК",
  subtitle = "Корпоративная экосистема управления документами",
  onContinue
}) => {
  return (
    <div className="static-welcome">
      <div className="welcome-container">
        {/* Верхняя секция с логотипом и заголовком */}
        <div className="welcome-header">
          <div className="corporate-logo">
            <img 
              src={corporateEmblem} 
              alt="Корпоративная эмблема" 
              className="logo-image"
            />
          </div>
          <h1 className="company-title">{companyName}</h1>
          <p className="company-subtitle">{subtitle}</p>
        </div>

        {/* Средняя секция с контентом */}
        <div className="welcome-content">
          <div className="welcome-divider">
            <div className="divider-line"></div>
            <div className="divider-emblem">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div className="divider-line"></div>
          </div>

          <div className="system-info">
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <span>Excel Analytics</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📝</div>
                <span>Word Processing</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📄</div>
                <span>PDF Management</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🧠</div>
                <span>AI Assistant</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔌</div>
                <span>Extensions Hub</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">☁️</div>
                <span>Cloud Sync</span>
              </div>
            </div>
            <p className="system-version">Document Management Platform v2.0 • AI-Powered</p>
            <p className="access-time">
              Время входа: {new Date().toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {onContinue && (
            <button className="continue-btn" onClick={onContinue}>
              <span>Продолжить</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Нижняя секция со статусом */}
        <div className="status-bar">
          <div className="status-item">
            <div className="status-indicator online"></div>
            <span>Система активна</span>
          </div>
          <div className="status-item">
            <div className="status-indicator secure"></div>
            <span>Защищенное соединение</span>
          </div>
        </div>
      </div>

      {/* Фоновые элементы */}
      <div className="background-elements">
        <div className="bg-pattern pattern-1"></div>
        <div className="bg-pattern pattern-2"></div>
        <div className="bg-pattern pattern-3"></div>
      </div>
    </div>
  );
};

export default StaticWelcome;
