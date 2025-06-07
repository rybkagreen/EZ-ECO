import React, { useState, useEffect } from 'react';
import { FileExplorer } from '../FileExplorer/FileExplorer';
import { CodeChan } from '../CodeChan/CodeChan';
import { ConnectionStatus } from '../ConnectionStatus/ConnectionStatus';
import { FileItem } from '../../types/FileTypes';
import { CodeChanMood } from '../CodeChan/CodeChanTypes';
import { FileService } from '../../services/FileService';
import { WebSocketService } from '../../services/WebSocketService';
import './FileManager.css';

interface FileManagerProps {
    initialPath?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
    initialPath = '/' 
}) => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [codeChanMood, setCodeChanMood] = useState<CodeChanMood>('happy');
    const [codeChanMessage, setCodeChanMessage] = useState('Привет! Я Code Chan, твой помощник в работе с файлами!');
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
    const fileService = new FileService();
    const wsService = WebSocketService.getInstance();

    useEffect(() => {
        // Проверяем тему из localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

    useEffect(() => {
        // Подписываемся на WebSocket события
        const handleConnectionStatus = (data: any) => {
            setIsWebSocketConnected(data.status === 'connected');
            if (data.status === 'connected') {
                setCodeChanMood('happy');
                setCodeChanMessage('WebSocket соединение установлено! Real-time обновления активны! Nya~');
            } else if (data.status === 'disconnected') {
                setIsWebSocketConnected(false);
                setCodeChanMood('sad');
                setCodeChanMessage('WebSocket соединение потеряно... Попробую переподключиться...');
            }
        };

        const handleFileChanges = (data: any) => {
            setCodeChanMood('thinking');
            setCodeChanMessage(`Обнаружены изменения в файловой системе: ${data.message || 'файлы обновлены'}`);
            
            // Автоматически обновляем список файлов через 1 секунду
            setTimeout(() => {
                setCodeChanMood('happy');
                setCodeChanMessage('Файлы обновлены! Nya~');
            }, 1000);
        };

        const handlePong = (data: any) => {
            setCodeChanMood('happy');
            setCodeChanMessage(`Pong получен! Соединение работает отлично! Nya~`);
        };

        const handleFilesList = (data: any) => {
            setCodeChanMood('thinking');
            setCodeChanMessage(`Получен список из ${data.count || 0} файлов через WebSocket!`);
            
            setTimeout(() => {
                setCodeChanMood('happy');
                setCodeChanMessage('WebSocket данные синхронизированы! Nya~');
            }, 1500);
        };

        const handleProjectInfo = (data: any) => {
            setCodeChanMood('explaining');
            setCodeChanMessage(`Проект: ${data.info?.project_name} | Backend: ${data.info?.backend} | WebSocket: активен!`);
        };

        const handleError = (data: any) => {
            setCodeChanMood('error');
            setCodeChanMessage(`WebSocket ошибка: ${data.message || 'Неизвестная ошибка'}`);
        };

        wsService.subscribe('connection', handleConnectionStatus);
        wsService.subscribe('connection_status', handleConnectionStatus);
        wsService.subscribe('file_changes', handleFileChanges);
        wsService.subscribe('pong', handlePong);
        wsService.subscribe('files_list', handleFilesList);
        wsService.subscribe('project_info', handleProjectInfo);
        wsService.subscribe('error', handleError);

        return () => {
            wsService.unsubscribe('connection', handleConnectionStatus);
            wsService.unsubscribe('connection_status', handleConnectionStatus);
            wsService.unsubscribe('file_changes', handleFileChanges);
            wsService.unsubscribe('pong', handlePong);
            wsService.unsubscribe('files_list', handleFilesList);
            wsService.unsubscribe('project_info', handleProjectInfo);
            wsService.unsubscribe('error', handleError);
        };
    }, [wsService]);

    const handleFileSelect = (file: FileItem) => {
        setSelectedFile(file);
        setCodeChanMood('working');
        setCodeChanMessage(`Открываю файл ${file.name}...`);
        
        // Симуляция загрузки файла
        setTimeout(() => {
            setCodeChanMood('happy');
            setCodeChanMessage(`Файл ${file.name} успешно загружен! Nya~`);
        }, 1500);
    };

    const handleDirectoryChange = (path: string) => {
        setCurrentPath(path);
        setCodeChanMood('thinking');
        setCodeChanMessage(`Исследую папку ${path}...`);
        
        setTimeout(() => {
            setCodeChanMood('happy');
            setCodeChanMessage(`Готово! Показываю содержимое папки ${path}`);
        }, 1000);
    };

    const handleThemeToggle = () => {
        setIsDarkTheme(!isDarkTheme);
        setCodeChanMood('surprised');
        setCodeChanMessage(isDarkTheme ? 'Переключаюсь на светлую тему!' : 'Переключаюсь на тёмную тему!');
        
        setTimeout(() => {
            setCodeChanMood('happy');
            setCodeChanMessage('Новая тема выглядит отлично!');
        }, 2000);
    };

    const handleUpload = () => {
        setCodeChanMood('coding');
        setCodeChanMessage('Готовлюсь к загрузке файлов...');
        
        // Здесь будет логика загрузки файлов
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                setCodeChanMood('coding');
                setCodeChanMessage(`Загружаю ${files.length} файл(ов)...`);
                
                // Симуляция загрузки
                setTimeout(() => {
                    setCodeChanMood('happy');
                    setCodeChanMessage(`Успешно загружено ${files.length} файл(ов)! Nya~`);
                }, 3000);
            }
        };
        input.click();
    };

    const handleCreateFolder = async () => {
        const folderName = prompt('Введите название папки:');
        if (folderName) {
            setCodeChanMood('coding');
            setCodeChanMessage(`Создаю папку "${folderName}"...`);
            
            try {
                await fileService.createDirectory(folderName, currentPath);
                setCodeChanMood('happy');
                setCodeChanMessage(`Папка "${folderName}" создана! Meow~`);
            } catch (error) {
                setCodeChanMood('error');
                setCodeChanMessage(`Ошибка при создании папки: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const handleFileUpload = (uploadedFiles: FileItem[]) => {
        setCodeChanMood('happy');
        setCodeChanMessage(`Успешно загружено ${uploadedFiles.length} файл(ов)! Nya~`);
    };

    return (
        <div className={`file-manager ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <header className="file-manager-header">
                <div className="header-left">
                    <h1>File Manager with Code Chan</h1>
                    <div className="breadcrumb">
                        {currentPath.split('/').filter(Boolean).map((segment, index, array) => (
                            <span key={index} className="breadcrumb-item">
                                {index > 0 && <span className="breadcrumb-separator">/</span>}
                                <button 
                                    className="breadcrumb-link"
                                    onClick={() => {
                                        const newPath = '/' + array.slice(0, index + 1).join('/');
                                        setCurrentPath(newPath);
                                    }}
                                >
                                    {segment}
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="header-right">
                    <button 
                        className="action-btn upload-btn"
                        onClick={handleUpload}
                        title="Загрузить файлы"
                    >
                        📤 Загрузить
                    </button>
                    <button 
                        className="action-btn create-folder-btn"
                        onClick={handleCreateFolder}
                        title="Создать папку"
                    >
                        📁 Создать папку
                    </button>
                    <button 
                        className="action-btn theme-toggle-btn"
                        onClick={handleThemeToggle}
                        title={isDarkTheme ? "Светлая тема" : "Тёмная тема"}
                    >
                        {isDarkTheme ? '☀️' : '🌙'}
                    </button>
                    
                    {/* WebSocket тестирование */}
                    <div className="websocket-controls">
                        <button 
                            className="action-btn websocket-btn"
                            onClick={() => wsService.ping()}
                            title="Ping WebSocket"
                        >
                            🏓 Ping
                        </button>
                        <button 
                            className="action-btn websocket-btn"
                            onClick={() => wsService.requestProjectInfo()}
                            title="Информация о проекте"
                        >
                            ℹ️ Info
                        </button>
                        <button 
                            className="action-btn websocket-btn"
                            onClick={() => wsService.requestFilesList(currentPath)}
                            title="Список файлов через WebSocket"
                        >
                            📋 WS Files
                        </button>
                        <span className={`connection-indicator ${isWebSocketConnected ? 'connected' : 'disconnected'}`}>
                            {isWebSocketConnected ? '🟢' : '🔴'} WS
                        </span>
                    </div>
                </div>
            </header>

            <main className="file-manager-main">
                <div className="file-explorer-container">
                    <FileExplorer
                        initialPath={currentPath}
                        onFileSelect={handleFileSelect}
                        onDirectoryChange={handleDirectoryChange}
                        onFileUpload={handleFileUpload}
                    />
                </div>

                {selectedFile && (
                    <div className="file-preview-container">
                        <div className="file-preview-header">
                            <h3>Предварительный просмотр</h3>
                            <button 
                                className="close-preview-btn"
                                onClick={() => setSelectedFile(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="file-preview-content">
                            <div className="file-info">
                                <h4>{selectedFile.name}</h4>
                                <p>Размер: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                                {selectedFile.modified && (
                                    <p>Изменён: {new Date(selectedFile.modified).toLocaleString()}</p>
                                )}
                                <p>Путь: {selectedFile.path}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <CodeChan
                mood={codeChanMood}
                message={codeChanMessage}
            />
            <ConnectionStatus />
        </div>
    );
};
