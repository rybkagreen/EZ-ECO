import React from 'react';
import ModernButton from '../ModernButton';
import './QuickActions.css';

interface QuickActionsProps {
    onNewFolder: () => void;
    onUpload: () => void;
    onRefresh: () => void;
    onSettings: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onNewFolder,
    onUpload,
    onRefresh,
    onSettings
}) => {
    const actions = [
        {
            id: 'new-folder',
            label: 'Новая папка',
            icon: '📁+',
            onClick: onNewFolder,
            color: '#48bb78'
        },
        {
            id: 'upload',
            label: 'Загрузить',
            icon: '📤',
            onClick: onUpload,
            color: '#667eea'
        },
        {
            id: 'refresh',
            label: 'Обновить',
            icon: '🔄',
            onClick: onRefresh,
            color: '#ed8936'
        },
        {
            id: 'settings',
            label: 'Настройки',
            icon: '⚙️',
            onClick: onSettings,
            color: '#9f7aea'
        }
    ];

    return (
        <div className="quick-actions">
            <h4 className="quick-actions-title">⚡ Быстрые действия</h4>
            <div className="quick-actions-grid">
                <ModernButton 
                    type="outline" 
                    size="medium" 
                    onClick={onNewFolder}
                    className="action-new-folder"
                >
                    📁+ Новая папка
                </ModernButton>
                <ModernButton 
                    type="outline" 
                    size="medium" 
                    onClick={onUpload}
                    className="action-upload"
                >
                    📤 Загрузить
                </ModernButton>
                <ModernButton 
                    type="outline" 
                    size="medium" 
                    onClick={onRefresh}
                    className="action-refresh"
                >
                    🔄 Обновить
                </ModernButton>
                <ModernButton 
                    type="outline" 
                    size="medium" 
                    onClick={onSettings}
                    className="action-settings"
                >
                    ⚙️ Настройки
                </ModernButton>
            </div>
        </div>
    );
};
