import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ArchiveDashboard from './ArchiveDashboard';
import ArchiveSearch from './ArchiveSearch';
import ArchiveCategories from './ArchiveCategories';
import ArchiveJobs from './ArchiveJobs';
import ArchiveSettings from './ArchiveSettings';
import ArchiveAnalytics from './ArchiveAnalytics';
import ArchiveNavigation from './ArchiveNavigation';
import './Archive.css';

const ArchiveMain = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="archive-main">
      <div className="archive-header">
        <div className="archive-title-section">
          <h1 className="archive-title">
            <span className="archive-icon">📁</span>
            Автоматизированный Архив
          </h1>
          <p className="archive-subtitle">
            Интеллектуальное управление документами с ИИ поддержкой
          </p>
        </div>
        
        <ArchiveNavigation 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      <div className="archive-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ArchiveDashboard />} />
          <Route path="/search" element={<ArchiveSearch />} />
          <Route path="/categories" element={<ArchiveCategories />} />
          <Route path="/jobs" element={<ArchiveJobs />} />
          <Route path="/analytics" element={<ArchiveAnalytics />} />
          <Route path="/settings" element={<ArchiveSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default ArchiveMain;
