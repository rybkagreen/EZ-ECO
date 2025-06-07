import React, { useEffect, useState } from 'react';
import { FileItem } from '../../types/FileTypes';
import { WebSocketService } from '../../services/WebSocketService';
import { FileService } from '../../services/FileService';
import { FileDropZone } from '../FileDropZone/FileDropZone';
import { DraggableFileItem } from '../DraggableFileItem/DraggableFileItem';
import { ToastManager } from '../Toast/Toast';
import { CodeChan } from '../CodeChan/CodeChan';
import { CodeChanMood } from '../CodeChan/CodeChanTypes';
import { SearchBar } from '../SearchBar/SearchBar';
import { FileInfo } from '../FileInfo/FileInfo';
import { FileStats } from '../FileStats/FileStats';
import { QuickActions } from '../QuickActions/QuickActions';
import { FilePreview } from '../FilePreview/FilePreview';
import { useToast } from '../../hooks/useToast';
import { useHotKeys, HotKey } from '../../hooks/useHotKeys';
import './FileExplorer.css';

interface FileExplorerProps {
    initialPath: string;
    onFileSelect?: (file: FileItem) => void;
    onDirectoryChange?: (path: string) => void;
    onFileUpload?: (files: FileItem[]) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    initialPath,
    onFileSelect,
    onDirectoryChange,
    onFileUpload,
}) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showFileInfo, setShowFileInfo] = useState<FileItem | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const fileService = new FileService();
    const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
    
    // Состояние Code Chan
    const [codeChanState, setCodeChanState] = useState({
        message: "Добро пожаловать в файловый менеджер! Перетащите файлы для загрузки 📁✨",
        mood: 'happy' as CodeChanMood
    });

    // Функции для поиска и фильтрации
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        applyFilters(files, query, filterType);
    };

    const handleFilterChange = (type: string) => {
        setFilterType(type);
        applyFilters(files, searchQuery, type);
    };

    const applyFilters = (fileList: FileItem[], query: string, type: string) => {
        let filtered = [...fileList];

        // Применяем поиск
        if (query.trim()) {
            filtered = filtered.filter(file => 
                file.name.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Применяем фильтр по типу
        switch (type) {
            case 'files':
                filtered = filtered.filter(file => !file.is_directory);
                break;
            case 'folders':
                filtered = filtered.filter(file => file.is_directory);
                break;
            case 'images':
                filtered = filtered.filter(file => {
                    if (file.is_directory) return false;
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '');
                });
                break;
            case 'documents':
                filtered = filtered.filter(file => {
                    if (file.is_directory) return false;
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext || '');
                });
                break;
            case 'code':
                filtered = filtered.filter(file => {
                    if (file.is_directory) return false;
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'scss', 'html', 'php', 'go', 'rs', 'swift'].includes(ext || '');
                });
                break;
            case 'media':
                filtered = filtered.filter(file => {
                    if (file.is_directory) return false;
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'flac', 'aac'].includes(ext || '');
                });
                break;
            default:
                // 'all' - не фильтруем
                break;
        }

        setFilteredFiles(filtered);
    };

    useEffect(() => {
        const ws = WebSocketService.getInstance();
        
        // Подписка на обновления файловой системы
        ws.subscribe('file_system_updates', (data) => {
            if (data.path.startsWith(currentPath)) {
                fetchFiles();
            }
        });

        fetchFiles();

        return () => {
            ws.unsubscribe('file_system_updates');
        };
    }, [currentPath]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const data = await fileService.getFiles(currentPath);
            setFiles(data);
            applyFilters(data, searchQuery, filterType); // Применяем текущие фильтры
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilesDropped = async (fileList: FileList) => {
        try {
            setLoading(true);
            setCodeChanState({
                message: `Обрабатываю ${fileList.length} файл(ов)... 💻⚡`,
                mood: 'working'
            });
            
            const files = Array.from(fileList);
            
            showWarning(`Загрузка ${files.length} файл(ов)...`);
            
            const uploadPromises = files.map(file => fileService.uploadFile(file, currentPath));
            const uploadedFiles = await Promise.all(uploadPromises);
            
            setCodeChanState({
                message: `Отлично! Загружено ${files.length} файл(ов)! 🎉`,
                mood: 'happy'
            });
            showSuccess(`Успешно загружено ${files.length} файл(ов)`);
            onFileUpload?.(uploadedFiles);
            await fetchFiles(); // Обновляем список файлов
            
            setTimeout(() => {
                setCodeChanState({
                    message: "Что загрузим дальше? 😊",
                    mood: 'happy'
                });
            }, 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки';
            setCodeChanState({
                message: `Упс! Что-то пошло не так... 😵‍💫`,
                mood: 'error'
            });
            showError(`Не удалось загрузить файлы: ${errorMessage}`);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file: FileItem) => {
        setSelectedFile(file);
        if (file.is_directory) {
            const newPath = file.path + '/' + file.name;
            setCurrentPath(newPath);
            onDirectoryChange?.(newPath);
        } else {
            onFileSelect?.(file);
        }
    };

    const handleFileMove = async (sourceFile: FileItem, targetPath: string) => {
        try {
            setLoading(true);
            setCodeChanState({
                message: `Перемещаю "${sourceFile.name}"... 🚀`,
                mood: 'working'
            });
            showWarning(`Перемещение ${sourceFile.name}...`);
            
            await fileService.moveFile(sourceFile.path + '/' + sourceFile.name, targetPath);
            
            setCodeChanState({
                message: `Файл успешно перемещен! 🎯`,
                mood: 'happy'
            });
            showSuccess(`Файл "${sourceFile.name}" успешно перемещен`);
            await fetchFiles(); // Обновляем список файлов
            
            setTimeout(() => {
                setCodeChanState({
                    message: "Готов к новым операциям! 😊",
                    mood: 'happy'
                });
            }, 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при перемещении файла';
            setCodeChanState({
                message: `Не могу переместить файл... 😓`,
                mood: 'error'
            });
            showError(`Не удалось переместить файл: ${errorMessage}`);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const navigateUp = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
        onDirectoryChange?.(parentPath);
    };

    const handleFileDelete = async (file: FileItem) => {
        try {
            setLoading(true);
            setCodeChanState({
                message: `Удаляю "${file.name}"... 🗑️`,
                mood: 'thinking'
            });
            showWarning(`Удаление ${file.name}...`);
            
            await fileService.deleteFile(file.path + '/' + file.name);
            
            setCodeChanState({
                message: `Файл успешно удален! ✨`,
                mood: 'happy'
            });
            showSuccess(`"${file.name}" успешно удален`);
            await fetchFiles();
            
            setTimeout(() => {
                setCodeChanState({
                    message: "Пространство освобождено! 📁",
                    mood: 'happy'
                });
            }, 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении';
            setCodeChanState({
                message: `Не получается удалить... 😵‍💫`,
                mood: 'error'
            });
            showError(`Не удалось удалить файл: ${errorMessage}`);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFileRename = async (file: FileItem, newName: string) => {
        try {
            setLoading(true);
            showWarning(`Переименование ${file.name}...`);
            
            const newPath = file.path + '/' + newName;
            await fileService.moveFile(file.path + '/' + file.name, newPath);
            
            showSuccess(`"${file.name}" переименован в "${newName}"`);
            await fetchFiles();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при переименовании';
            showError(`Не удалось переименовать файл: ${errorMessage}`);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFileCopy = async (file: FileItem) => {
        try {
            // Копируем путь в буфер обмена (простая реализация)
            await navigator.clipboard.writeText(file.path + '/' + file.name);
            showSuccess(`Путь к "${file.name}" скопирован в буфер обмена`);
        } catch (err) {
            showError('Не удалось скопировать путь в буфер обмена');
        }
    };

    const handleFileInfoToggle = (file: FileItem) => {
        setShowFileInfo(file);
    };

    // Обработчики быстрых действий
    const handleNewFolder = async () => {
        const folderName = prompt('Введите название новой папки:');
        if (folderName) {
            try {
                setCodeChanState({
                    message: `Создаю папку "${folderName}"... 📁✨`,
                    mood: 'working'
                });
                showWarning(`Создание папки "${folderName}"...`);
                
                await fileService.createFolder(folderName, currentPath);
                
                setCodeChanState({
                    message: `Папка "${folderName}" создана! 🎉`,
                    mood: 'happy'
                });
                showSuccess(`Папка "${folderName}" успешно создана`);
                await fetchFiles(); // Обновляем список файлов
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании папки';
                setCodeChanState({
                    message: `Не удалось создать папку... 😓`,
                    mood: 'error'
                });
                showError(`Не удалось создать папку: ${errorMessage}`);
            }
        }
    };

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) {
                handleFilesDropped(files);
            }
        };
        input.click();
    };

    const handleRefresh = () => {
        setCodeChanState({
            message: 'Обновляю список файлов... 🔄',
            mood: 'working'
        });
        fetchFiles();
        showSuccess('Список файлов обновлен');
        setTimeout(() => {
            setCodeChanState({
                message: 'Список обновлен! Все актуально! ✨',
                mood: 'happy'
            });
        }, 1000);
    };

    const handleSettings = () => {
        setCodeChanState({
            message: 'Открываю панель настроек... 🔧✨',
            mood: 'thinking'
        });
        
        // Демонстрация различных настроек
        const settings = [
            'Тема интерфейса',
            'Размер сетки файлов', 
            'Автоматическое обновление',
            'Уведомления',
            'Язык интерфейса',
            'Горячие клавиши'
        ];
        
        setTimeout(() => {
            setCodeChanState({
                message: `Доступные настройки: ${settings.slice(0, 3).join(', ')} и еще ${settings.length - 3}! 🛠️`,
                mood: 'happy'
            });
        }, 1500);
        
        setTimeout(() => {
            setCodeChanState({
                message: 'Настройки будут добавлены в следующей версии! А пока давайте поработаем с файлами! 📁✨',
                mood: 'happy'
            });
        }, 4000);
    };

    // Дополнительные обработчики для демонстрации
    const handleCodeChanDemo = () => {
        const demoMessages = [
            { message: "Давайте я покажу свои возможности! 🌟", mood: 'excited' as CodeChanMood },
            { message: "Я могу помочь вам с файлами! 📁", mood: 'happy' as CodeChanMood },
            { message: "Попробуйте перетащить файл или создать папку! 🚀", mood: 'thinking' as CodeChanMood },
            { message: "Я буду реагировать на ваши действия! 😊", mood: 'happy' as CodeChanMood },
            { message: "Готов к работе! Что будем делать? ✨", mood: 'happy' as CodeChanMood }
        ];
        
        let index = 0;
        const showNextMessage = () => {
            if (index < demoMessages.length) {
                setCodeChanState(demoMessages[index]);
                index++;
                setTimeout(showNextMessage, 2500);
            }
        };
        showNextMessage();
    };

    // Обработчик предварительного просмотра файла
    const handleFilePreview = (file: FileItem) => {
        if (file.type === 'file') {
            setPreviewFile(file);
            setCodeChanState({
                message: `Открываю предварительный просмотр файла ${file.name} 👀`,
                mood: 'working'
            });
        }
    };

    // Закрытие предварительного просмотра
    const handleClosePreview = () => {
        setPreviewFile(null);
        setCodeChanState({
            message: "Предварительный просмотр закрыт! Что дальше? 😊",
            mood: 'happy'
        });
    };

    // Горячие клавиши для FileExplorer
    const hotKeys: HotKey[] = [
        { key: 'n', ctrl: true, action: handleNewFolder, description: 'Файлы: Создать папку' },
        { key: 'u', ctrl: true, action: handleUpload, description: 'Файлы: Загрузить файлы' },
        { key: 'F5', action: handleRefresh, description: 'Обновить список файлов' },
        { key: 'Delete', action: () => selectedFile && handleFileDelete(selectedFile), description: 'Удалить выбранный файл' },
        { key: 'Enter', action: () => selectedFile && handleFileClick(selectedFile), description: 'Открыть выбранный файл/папку' },
        { key: 'Backspace', action: navigateUp, description: 'Перейти на уровень вверх' },
        { key: 'i', ctrl: true, action: () => selectedFile && handleFileInfoToggle(selectedFile), description: 'Информация о файле' },
        { key: 'p', ctrl: true, action: () => selectedFile && !selectedFile.is_directory && handleFilePreview(selectedFile), description: 'Предварительный просмотр' }
    ];

    useHotKeys(hotKeys);

    return (
        <>
            <FileDropZone onFilesSelected={handleFilesDropped} currentPath={currentPath}>
                <div className="file-explorer">
                    <div className="file-explorer-header">
                        <button 
                            onClick={navigateUp}
                            disabled={currentPath === '/'}
                            className="navigate-up-btn"
                        >
                            ↑ Up
                        </button>
                        <div className="current-path">{currentPath}</div>
                    </div>
                    
                    <div className="file-explorer-controls">
                        <SearchBar 
                            onSearch={handleSearch}
                            onFilterChange={handleFilterChange}
                        />
                        
                        <FileStats 
                            files={filteredFiles}
                            currentPath={currentPath}
                        />
                        
                        <QuickActions 
                            onNewFolder={handleNewFolder}
                            onUpload={handleUpload}
                            onRefresh={handleRefresh}
                            onSettings={handleSettings}
                        />
                    </div>
                    
                    {loading && <div className="file-explorer-loading">Loading...</div>}
                    {error && <div className="file-explorer-error">{error}</div>}
                    
                    {!loading && !error && (
                        <div className="file-list">
                            {filteredFiles.sort((a, b) => {
                                // Сначала директории, потом файлы
                                if (a.is_directory && !b.is_directory) return -1;
                                if (!a.is_directory && b.is_directory) return 1;
                                return a.name.localeCompare(b.name);
                            }).map((file, index) => (
                                <DraggableFileItem
                                    key={`${file.name}-${index}`}
                                    file={file}
                                    isSelected={selectedFile?.name === file.name}
                                    onSelect={handleFileClick}
                                    onMove={handleFileMove}
                                    onDelete={handleFileDelete}
                                    onRename={handleFileRename}
                                    onCopy={handleFileCopy}
                                    onInfo={handleFileInfoToggle}
                                    onPreview={handleFilePreview} // Обработчик предварительного просмотра
                                />
                            ))}
                        </div>
                    )}
                    
                    {showFileInfo && (
                        <FileInfo 
                            file={showFileInfo} 
                            onClose={() => setShowFileInfo(null)}
                        />
                    )}
                    
                    {previewFile && (
                        <FilePreview 
                            file={previewFile}
                            onClose={handleClosePreview}
                        />
                    )}
                </div>
            </FileDropZone>
            
            <CodeChan 
                message={codeChanState.message}
                mood={codeChanState.mood}
                onInteract={handleCodeChanDemo}
            />
            
            <ToastManager toasts={toasts} onRemoveToast={removeToast} />
        </>
    );
};
