import React, { useState, useEffect } from 'react';
import { FileExplorer } from '../FileExplorer/FileExplorer';
import { ConnectionStatus } from '../ConnectionStatus/ConnectionStatus';
import { FileItem } from '../../types/FileTypes';
import { FileService } from '../../services/FileService';
import { WebSocketService } from '../../services/WebSocketService';

interface FileManagerProps {
    initialPath?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
    initialPath = '/' 
}) => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [codeChanMessage, setCodeChanMessage] = useState('Привет! Я готов помочь с файлами!');
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const fileService = new FileService();

    useEffect(() => {
        // Проверяем тему из localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
        
        // Инициализация WebSocket
        const ws = WebSocketService.getInstance();
        
        // Подписка на изменения соединения
        ws.subscribe('connection', (data) => {
            console.log('WebSocket connection status:', data);
            setWsConnected(data.status === 'connected');
            
            if (data.status === 'connected') {
                setCodeChanMessage('🎉 WebSocket подключен! Теперь файлы обновляются в реальном времени!');
            } else if (data.status === 'disconnected') {
                setCodeChanMessage('⚠️ WebSocket отключен. Обновления в реальном времени недоступны.');
            }
        });

        // Подписка на обновления файловой системы
        ws.subscribe('file_system_update', (data) => {
            console.log('File system update:', data);
            setCodeChanMessage(`📁 Обнаружены изменения в файловой системе: ${data.path || 'unknown'}`);
        });

        return () => {
            ws.unsubscribe('connection');
            ws.unsubscribe('file_system_update');
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

    const handleFileSelect = (file: FileItem) => {
        setSelectedFile(file);
        setCodeChanMessage(`📄 Выбран файл: ${file.name}`);
    };

    const handleDirectoryChange = (path: string) => {
        setCurrentPath(path);
        setCodeChanMessage(`📂 Переход в папку: ${path}`);
    };

    const handleFileUpload = (files: FileItem[]) => {
        setCodeChanMessage(`✅ Загружено ${files.length} файл(ов)!`);
    };

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
        setCodeChanMessage(isDarkTheme ? '☀️ Переключено на светлую тему!' : '🌙 Переключено на тёмную тему!');
    };

    return (
        <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Заголовок */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            📁 File Manager with Code Chan
                        </h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {currentPath}
                        </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Статус WebSocket соединения */}
                        <ConnectionStatus />
                        
                        {/* Переключатель темы */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="Переключить тему"
                        >
                            {isDarkTheme ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Основной контент */}
            <main className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Файловый менеджер */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <FileExplorer
                                initialPath={currentPath}
                                onFileSelect={handleFileSelect}
                                onDirectoryChange={handleDirectoryChange}
                                onFileUpload={handleFileUpload}
                            />
                        </div>
                    </div>

                    {/* Боковая панель с Code Chan и информацией */}
                    <div className="space-y-6">
                        {/* Code Chan */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                🐱 Code Chan
                            </h3>
                            
                            {/* Простой аватар Code Chan */}
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                                    😸
                                </div>
                            </div>
                            
                            {/* Сообщение от Code Chan */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {codeChanMessage}
                                </p>
                            </div>
                        </div>

                        {/* Информация о выбранном файле */}
                        {selectedFile && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                    📋 Информация о файле
                                </h3>
                                
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Имя:</span>
                                        <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedFile.name}</span>
                                    </div>
                                    
                                    {selectedFile.path && (
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Путь:</span>
                                            <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedFile.path}</span>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Тип:</span>
                                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                                            {selectedFile.is_directory ? 'Папка' : 'Файл'}
                                        </span>
                                    </div>
                                    
                                    {selectedFile.size !== undefined && !selectedFile.is_directory && (
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Размер:</span>
                                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                                {(selectedFile.size / 1024).toFixed(2)} КБ
                                            </span>
                                        </div>
                                    )}
                                    
                                    {selectedFile.modified && (
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Изменён:</span>
                                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                                {new Date(Number(selectedFile.modified) * 1000).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Статистика WebSocket */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                📊 Статус
                            </h3>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">WebSocket:</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        wsConnected 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {wsConnected ? 'Подключен' : 'Отключен'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Тема:</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {isDarkTheme ? 'Тёмная' : 'Светлая'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Путь:</span>
                                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                                        {currentPath}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
