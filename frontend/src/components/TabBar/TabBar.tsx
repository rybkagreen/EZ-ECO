import React from 'react';
import './TabBar.css';

interface Tab {
    id: string;
    name: string;
    path: string;
    active: boolean;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabSelect: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    onNewTab
}) => {
    return (
        <div className="tab-bar">
            <div className="tabs-container">
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                        onClick={() => onTabSelect(tab.id)}
                    >
                        <span className="tab-icon">📁</span>
                        <span className="tab-name">{tab.name}</span>
                        {tabs.length > 1 && (
                            <button 
                                className="tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
                
                <button className="new-tab-btn" onClick={onNewTab} title="Новая вкладка">
                    +
                </button>
            </div>
        </div>
    );
};
