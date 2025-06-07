import React from 'react';
import './Header.css';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "Единый Заказчик", 
  showLogo = true,
  className = '' 
}) => {
  return (
    <header className={`app-header ${className}`}>
      {showLogo && (
        <div className="header-logo">
          <img src="/logo-ez.png" alt="Единый Заказчик" />
          <div className="header-brand">
            <span className="header-title">{title}</span>
            <span className="header-subtitle">Корпоративная система управления</span>
          </div>
        </div>
      )}
      
      <div className="header-actions">
        <button className="header-btn">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        
        <button className="header-btn">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        
        <div className="header-user">
          <div className="user-avatar">
            <span>АД</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
