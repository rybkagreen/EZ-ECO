import React from 'react';

const ArchiveNavigation = ({ activeSection, onSectionChange }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Дашборд', icon: '📊' },
    { id: 'search', label: 'Поиск', icon: '🔍' },
    { id: 'categories', label: 'Категории', icon: '📂' },
    { id: 'jobs', label: 'Задания', icon: '⚙️' },
    { id: 'analytics', label: 'Аналитика', icon: '📈' },
    { id: 'settings', label: 'Настройки', icon: '⚙️' }
  ];

  return (
    <nav className="archive-navigation">
      {navigationItems.map(item => (
        <button
          key={item.id}
          className={`archive-nav-item ${activeSection === item.id ? 'active' : ''}`}
          onClick={() => onSectionChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default ArchiveNavigation;
