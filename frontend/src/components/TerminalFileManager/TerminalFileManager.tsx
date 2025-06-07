import React, { useState, useEffect, useCallback } from 'react';
import { FileItem, FileTab } from '../../types/FileTypes';
import { SearchBar } from '../SearchBar/SearchBar';
import TerminalFileExplorer from '../TerminalFileExplorer';
import VerticalActions from '../VerticalActions';
import CompactFileStats from '../CompactFileStats';
import { TabBar } from '../TabBar/TabBar';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import PanelResizer from '../PanelResizer';
import HotKeysHelper from '../HotKeysHelper';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { AccessibilityHelper } from '../AccessibilityHelper';
import { AdvancedAnimations } from '../AdvancedAnimations';
import { FilePreviewCache } from '../FilePreviewCache';
import { ExportUtilities } from '../ExportUtilities';
import ModernButton from '../ModernButton';
import { useHotKeys, HotKey } from '../../hooks/useHotKeys';
import { FileService } from '../../services/FileService';
import { WebSocketService } from '../../services/WebSocketService';
import '../../styles/adaptive-logo.css';
import './TerminalFileManager.css';

interface TerminalFileManagerProps {
    onToggleChat: () => void;
    onToggleAI?: () => void;
    onShowExtensions?: () => void;
    onShowOfficeViewer?: () => void;
    onShowAIDemo?: () => void;
}

export const TerminalFileManager: React.FC<TerminalFileManagerProps> = ({ 
    onToggleChat, 
    onToggleAI,
    onShowExtensions,
    onShowOfficeViewer,
    onShowAIDemo 
}) => {
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabs, setTabs] = useState<FileTab[]>([{ id: '1', name: 'Home', path: '/', active: true }]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [wsConnected, setWsConnected] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
    const [showAccessibilityHelper, setShowAccessibilityHelper] = useState(false);
    const [showExportUtilities, setShowExportUtilities] = useState(false);
    const [performanceMetrics, setPerformanceMetrics] = useState({
        renderCount: 0,
        renderTime: 0,
        memoryUsage: 0,
        fileOperations: 0,
        averageLoadTime: 0,
    });
    
    const fileService = new FileService();

    useEffect(() => {
        // Инициализация WebSocket
        const ws = WebSocketService.getInstance();
        
        ws.subscribe('connection', (data) => {
            setWsConnected(data.status === 'connected');
        });

        return () => {
            ws.unsubscribe('connection');
        };
    }, []);

    const handleFileSelect = (file: FileItem) => {
        setSelectedFile(file);
    };

    const handleDirectoryChange = (path: string) => {
        setCurrentPath(path);
        loadFiles(path);
        // Обновляем активную вкладку
        setTabs(prev => prev.map(tab => 
            tab.id === activeTabId ? { ...tab, path, name: path === '/' ? 'Home' : path.split('/').pop() || path } : tab
        ));
    };

    const loadFiles = useCallback(async (path: string = currentPath) => {
        const startTime = performance.now();
        try {
            const fileList = await fileService.getFiles(path);
            setFiles(fileList);
            
            // Update performance metrics
            const loadTime = performance.now() - startTime;
            setPerformanceMetrics(prev => ({
                ...prev,
                fileOperations: prev.fileOperations + 1,
                averageLoadTime: (prev.averageLoadTime + loadTime) / 2,
            }));
        } catch (error) {
            console.error('Error loading files:', error);
            setFiles([]);
        }
    }, [currentPath]);

    const handleCreateFile = () => {
        // TODO: Implement file creation
        console.log('Create file');
    };

    const handleCreateFolder = () => {
        // TODO: Implement folder creation
        console.log('Create folder');
    };

    const handleDeleteSelected = () => {
        if (selectedFile) {
            // TODO: Implement file deletion
            console.log('Delete file:', selectedFile.name);
        }
    };

    const handleCopySelected = () => {
        if (selectedFile) {
            // TODO: Implement file copy
            console.log('Copy file:', selectedFile.name);
        }
    };

    const handleMoveSelected = () => {
        if (selectedFile) {
            // TODO: Implement file move
            console.log('Move file:', selectedFile.name);
        }
    };

    const handleUploadFile = () => {
        // TODO: Implement file upload
        console.log('Upload file');
    };

    const handleDownloadSelected = () => {
        if (selectedFile) {
            // TODO: Implement file download
            console.log('Download file:', selectedFile.name);
        }
    };

    const handleEditSelected = () => {
        if (selectedFile) {
            // TODO: Implement file editing
            console.log('Edit file:', selectedFile.name);
        }
    };

    const handleSearch = () => {
        // TODO: Focus search bar
        console.log('Focus search');
    };

    const handleRefresh = () => {
        loadFiles();
    };

    const handleNewTab = () => {
        const newId = (Math.max(...tabs.map(t => parseInt(t.id)), 0) + 1).toString();
        const newTab = { id: newId, name: 'New Tab', path: currentPath, active: false };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (tabId: string) => {
        if (tabs.length === 1) return; // Don't close the last tab
        
        setTabs(prev => {
            const filtered = prev.filter(tab => tab.id !== tabId);
            if (activeTabId === tabId && filtered.length > 0) {
                setActiveTabId(filtered[filtered.length - 1].id);
            }
            return filtered;
        });
    };

    const handleTabSelect = (tabId: string) => {
        setActiveTabId(tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            setCurrentPath(tab.path);
        }
    };

    // Определение горячих клавиш
    const hotKeys: HotKey[] = [
        // Файловые операции
        { key: 'n', ctrl: true, action: handleCreateFile, description: 'Файлы: Создать файл' },
        { key: 'n', ctrl: true, shift: true, action: handleCreateFolder, description: 'Файлы: Создать папку' },
        { key: 'Delete', action: handleDeleteSelected, description: 'Файлы: Удалить выбранный' },
        { key: 'c', ctrl: true, action: handleCopySelected, description: 'Файлы: Копировать' },
        { key: 'x', ctrl: true, action: handleMoveSelected, description: 'Файлы: Вырезать' },
        { key: 'u', ctrl: true, action: handleUploadFile, description: 'Файлы: Загрузить файл' },
        { key: 'd', ctrl: true, action: handleDownloadSelected, description: 'Файлы: Скачать' },
        { key: 'Enter', action: handleEditSelected, description: 'Файлы: Редактировать' },
        
        // Навигация
        { key: 'f', ctrl: true, action: handleSearch, description: 'Навигация: Поиск' },
        { key: 'F5', action: handleRefresh, description: 'Навигация: Обновить' },
        { key: 't', ctrl: true, action: handleNewTab, description: 'Навигация: Новая вкладка' },
        
        // Интерфейс
        { key: 'F1', action: () => {}, description: 'Справка: Показать горячие клавиши' },
        { key: '`', ctrl: true, action: onToggleChat, description: 'Интерфейс: Открыть чат' },
        { key: 'r', ctrl: true, action: handleRefresh, description: 'Интерфейс: Обновить' },
        
        // Профессиональные функции
        { key: 'p', ctrl: true, shift: true, action: () => setShowPerformanceMonitor(!showPerformanceMonitor), description: 'Утилиты: Монитор производительности' },
        { key: 'a', ctrl: true, shift: true, action: () => setShowAccessibilityHelper(!showAccessibilityHelper), description: 'Утилиты: Помощник доступности' },
        { key: 'e', ctrl: true, shift: true, action: () => setShowExportUtilities(!showExportUtilities), description: 'Утилиты: Экспорт данных' }
    ];

    useHotKeys(hotKeys);

    // Обработчик для изменения размера панели
    const handlePanelResize = (delta: number) => {
        setSidebarWidth(prev => Math.max(200, Math.min(600, prev + delta)));
    };

    // Подсчет статистики
    const totalFiles = files.filter(f => !f.is_directory).length;
    const totalFolders = files.filter(f => f.is_directory).length;
    const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    const lastModified = files.length > 0 ? 
        new Date(Math.max(...files.map(f => f.modified ? (typeof f.modified === 'number' ? f.modified * 1000 : new Date(f.modified).getTime()) : 0))).toLocaleDateString('ru-RU') :
        'Нет данных';

    useEffect(() => {
        loadFiles();
        
        // Track render count for performance monitoring
        setPerformanceMetrics(prev => ({
            ...prev,
            renderCount: prev.renderCount + 1,
        }));
    }, [loadFiles]);

    return (
        <div className="terminal-file-manager">
            {/* Поиск в самом верху */}
            <div className="terminal-search-header">
                <img 
                    src="/EZ_Color.svg" 
                    alt="EZ Company Logo" 
                    className="header-logo company-logo" 
                />
                <SearchBar 
                    onSearch={setSearchQuery}
                    onFilterChange={(filter) => console.log('Filter changed:', filter)}
                    placeholder="🔍 Поиск файлов и папок..."
                />
                <div className="terminal-controls">
                    <HotKeysHelper hotKeys={hotKeys} />
                    <ModernButton 
                        type={showPerformanceMonitor ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                        className="performance-btn"
                    >
                        📊 Monitor
                    </ModernButton>
                    <ModernButton 
                        type={showAccessibilityHelper ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => setShowAccessibilityHelper(!showAccessibilityHelper)}
                        className="accessibility-btn"
                    >
                        ♿ Access
                    </ModernButton>
                    <ModernButton 
                        type={showExportUtilities ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => setShowExportUtilities(!showExportUtilities)}
                        className="export-btn"
                    >
                        📤 Export
                    </ModernButton>
                    <ThemeToggle />
                    <ModernButton 
                        type="secondary"
                        size="small"
                        onClick={onToggleChat}
                        className="chat-btn"
                    >
                        💬 Chat
                    </ModernButton>
                    {onToggleAI && (
                        <ModernButton 
                            type="primary"
                            size="small"
                            onClick={onToggleAI}
                            className="ai-btn pulse"
                        >
                            🤖 AI
                        </ModernButton>
                    )}
                    <div className={`connection-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
                        {wsConnected ? '🟢' : '🔴'}
                    </div>
                </div>
            </div>

            {/* Вкладки */}
            <TabBar 
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSelect={handleTabSelect}
                onTabClose={handleCloseTab}
                onNewTab={handleNewTab}
            />

            {/* Основная область с сайдбаром действий и файловым проводником */}
            <div className="terminal-main">
                {/* Вертикальные быстрые действия слева */}
                <div 
                    className="terminal-sidebar"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <VerticalActions 
                        onCreateFile={handleCreateFile}
                        onCreateFolder={handleCreateFolder}
                        onDeleteSelected={handleDeleteSelected}
                        onCopySelected={handleCopySelected}
                        onMoveSelected={handleMoveSelected}
                        onUploadFile={handleUploadFile}
                        onDownloadSelected={handleDownloadSelected}
                        onEditSelected={handleEditSelected}
                        onSearch={handleSearch}
                        onRefresh={handleRefresh}
                        onToggleChat={onToggleChat}
                        hasSelection={selectedFile !== null}
                        onShowExtensions={onShowExtensions}
                        onShowOfficeViewer={onShowOfficeViewer}
                        onShowAIDemo={onShowAIDemo}
                    />
                </div>

                {/* Разделитель панелей */}
                <PanelResizer
                    direction="horizontal"
                    onResize={handlePanelResize}
                    minSize={200}
                    maxSize={600}
                />

                {/* Файловый проводник */}
                <div className="terminal-explorer-area">
                    <AdvancedAnimations
                        animationType="fade"
                        direction="up"
                        trigger="load"
                        duration={300}
                    >
                        <TerminalFileExplorer
                            files={files}
                            currentPath={currentPath}
                            selectedFile={selectedFile}
                            searchQuery={searchQuery}
                            onFileSelect={handleFileSelect}
                            onDirectoryChange={handleDirectoryChange}
                        />
                    </AdvancedAnimations>
                </div>
            </div>

            {/* Профессиональные утилиты */}
            {showPerformanceMonitor && (
                <AdvancedAnimations
                    animationType="slide"
                    direction="down"
                    trigger="load"
                    duration={400}
                >
                    <div className="professional-panel">
                        <PerformanceMonitor
                            renderCount={performanceMetrics.renderCount}
                            renderTime={performanceMetrics.renderTime}
                            memoryUsage={performanceMetrics.memoryUsage}
                            fileOperations={performanceMetrics.fileOperations}
                            averageLoadTime={performanceMetrics.averageLoadTime}
                            onOptimizationSuggestion={(suggestion) => console.log('Optimization:', suggestion)}
                        />
                    </div>
                </AdvancedAnimations>
            )}

            {showAccessibilityHelper && (
                <AdvancedAnimations
                    animationType="slide"
                    direction="left"
                    trigger="load"
                    duration={400}
                >
                    <div className="professional-panel">
                        <AccessibilityHelper
                            onSettingsChange={(settings) => console.log('Accessibility settings:', settings)}
                            onAnnouncement={(message) => console.log('Screen reader:', message)}
                        />
                    </div>
                </AdvancedAnimations>
            )}

            {showExportUtilities && (
                <AdvancedAnimations
                    animationType="scale"
                    direction="center"
                    trigger="load"
                    duration={500}
                >
                    <div className="professional-panel">
                        <ExportUtilities
                            files={files.map(file => ({
                                path: file.path,
                                name: file.name,
                                size: file.size || 0,
                                type: file.is_directory ? 'directory' : (file.type || 'file'),
                                lastModified: file.modified ? (typeof file.modified === 'number' ? file.modified * 1000 : new Date(file.modified).getTime()) : Date.now(),
                                permissions: file.permissions ? file.permissions.map(p => `${p.userId}:${p.canRead ? 'r' : ''}${p.canWrite ? 'w' : ''}${p.canDelete ? 'd' : ''}`).join(',') : undefined,
                                owner: 'user',
                            }))}
                            onExportStart={(format) => console.log('Export started:', format)}
                            onExportComplete={(data, url) => console.log('Export complete:', data, url)}
                            onExportError={(error) => console.error('Export error:', error)}
                        />
                    </div>
                </AdvancedAnimations>
            )}

            {/* Cache for file previews */}
            <FilePreviewCache
                config={{
                    maxSize: 50,
                    maxMemory: 25,
                    enableThumbnails: true,
                    preloadStrategy: 'intelligent',
                }}
                onCacheUpdate={(stats) => console.log('Cache stats:', stats)}
                onPreviewGenerated={(preview) => console.log('Preview generated:', preview)}
            />

            {/* Компактная статистика внизу */}
            <div className="terminal-stats-footer">
                <CompactFileStats 
                    totalFiles={totalFiles}
                    totalFolders={totalFolders}
                    totalSize={formatSize(totalSize)}
                    lastModified={lastModified}
                />
            </div>
        </div>
    );
};
