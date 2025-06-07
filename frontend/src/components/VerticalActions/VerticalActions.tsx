import React from 'react';
import { 
    Plus, 
    Trash2, 
    Copy, 
    Move, 
    Upload, 
    Download,
    Edit3,
    Search,
    RefreshCw,
    MessageCircle
} from 'lucide-react';
import ModernButton from '../ModernButton';
import './VerticalActions.css';

interface VerticalActionsProps {
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onDeleteSelected: () => void;
    onCopySelected: () => void;
    onMoveSelected: () => void;
    onUploadFile: () => void;
    onDownloadSelected: () => void;
    onEditSelected: () => void;
    onSearch: () => void;
    onRefresh: () => void;
    onToggleChat: () => void;
    onShowExtensions?: () => void;
    onShowOfficeViewer?: () => void;
    onShowAIDemo?: () => void;
    hasSelection?: boolean;
}

export const VerticalActions: React.FC<VerticalActionsProps> = ({
    onCreateFile,
    onCreateFolder,
    onDeleteSelected,
    onCopySelected,
    onMoveSelected,
    onUploadFile,
    onDownloadSelected,
    onEditSelected,
    onSearch,
    onRefresh,
    onToggleChat,
    hasSelection = false,
    onShowExtensions,
    onShowOfficeViewer,
    onShowAIDemo
}) => {
    return (
        <div className="vertical-actions">
            <div className="actions-group">
                <ModernButton 
                    size="small"
                    type="outline"
                    onClick={onCreateFile}
                    title="Создать файл"
                >
                    <Plus size={16} />
                </ModernButton>
                
                <ModernButton 
                    size="small"
                    type="outline"
                    onClick={onUploadFile}
                    title="Загрузить файл"
                >
                    <Upload size={16} />
                </ModernButton>
            </div>

            <div className="actions-separator" />

            <div className="actions-group">
                <ModernButton 
                    size="small"
                    type="secondary"
                    onClick={onSearch}
                    title="Поиск"
                >
                    <Search size={16} />
                </ModernButton>
                
                <ModernButton 
                    size="small"
                    type="secondary"
                    onClick={onRefresh}
                    title="Обновить"
                >
                    <RefreshCw size={16} />
                </ModernButton>
            </div>

            {hasSelection && (
                <>
                    <div className="actions-separator" />
                    
                    <div className="actions-group selection-actions">
                        <ModernButton 
                            size="small"
                            type="outline"
                            onClick={onEditSelected}
                            title="Редактировать"
                        >
                            <Edit3 size={16} />
                        </ModernButton>
                        
                        <ModernButton 
                            size="small"
                            type="outline"
                            onClick={onCopySelected}
                            title="Копировать"
                        >
                            <Copy size={16} />
                        </ModernButton>
                        
                        <ModernButton 
                            size="small"
                            type="outline"
                            onClick={onMoveSelected}
                            title="Переместить"
                        >
                            <Move size={16} />
                        </ModernButton>
                        
                        <ModernButton 
                            size="small"
                            type="secondary"
                            onClick={onDownloadSelected}
                            title="Скачать"
                        >
                            <Download size={16} />
                        </ModernButton>
                        
                        <ModernButton 
                            size="small"
                            type="outline"
                            onClick={onDeleteSelected}
                            title="Удалить"
                            className="delete-action"
                        >
                            <Trash2 size={16} />
                        </ModernButton>
                    </div>
                </>
            )}

            <div className="actions-spacer" />

            <div className="actions-group">
                <ModernButton 
                    size="small"
                    type="primary"
                    onClick={onToggleChat}
                    title="Code Chan"
                    pulseAnimation={true}
                >
                    <MessageCircle size={16} />
                </ModernButton>
                <ModernButton
                    size="small"
                    type="secondary"
                    onClick={typeof onShowExtensions === 'function' ? onShowExtensions : undefined}
                    title="Маркетплейс расширений"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                </ModernButton>
                <ModernButton
                    size="small"
                    type="secondary"
                    onClick={typeof onShowOfficeViewer === 'function' ? onShowOfficeViewer : undefined}
                    title="Офисные документы (Excel, Word, PDF)"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </ModernButton>
                <ModernButton
                    size="small"
                    type="primary"
                    onClick={typeof onShowAIDemo === 'function' ? onShowAIDemo : undefined}
                    title="AI Интеграция с документами"
                    pulseAnimation={true}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
                </ModernButton>
            </div>
        </div>
    );
};

export default VerticalActions;
