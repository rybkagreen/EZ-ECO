import React, { useState, useEffect, useMemo } from 'react';
import { 
    Folder, 
    FolderOpen, 
    File, 
    ChevronRight, 
    ChevronDown,
    Image,
    Code,
    FileText,
    Archive,
    Music,
    Video
} from 'lucide-react';
import { FileItem } from '../../types/FileTypes';
import './TerminalFileExplorer.css';

interface TerminalFileExplorerProps {
    files: FileItem[];
    currentPath: string;
    selectedFile: FileItem | null;
    searchQuery: string;
    onFileSelect: (file: FileItem) => void;
    onDirectoryChange: (path: string) => void;
}

export const TerminalFileExplorer: React.FC<TerminalFileExplorerProps> = ({
    files,
    currentPath,
    selectedFile,
    searchQuery,
    onFileSelect,
    onDirectoryChange
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([currentPath]));

    // Фильтрация файлов по поисковому запросу
    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        
        return files.filter(file => 
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.path.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [files, searchQuery]);

    // Получение иконки файла по расширению
    const getFileIcon = (file: FileItem) => {
        if (file.is_directory) {
            return expandedFolders.has(file.path) ? 
                <FolderOpen className="file-icon folder-open" size={16} /> :
                <Folder className="file-icon folder" size={16} />;
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
            return <Image className="file-icon image" size={16} />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs'].includes(extension)) {
            return <Code className="file-icon code" size={16} />;
        }
        if (['txt', 'md', 'json', 'yaml', 'xml', 'csv'].includes(extension)) {
            return <FileText className="file-icon text" size={16} />;
        }
        if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
            return <Archive className="file-icon archive" size={16} />;
        }
        if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
            return <Music className="file-icon audio" size={16} />;
        }
        if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(extension)) {
            return <Video className="file-icon video" size={16} />;
        }
        
        return <File className="file-icon default" size={16} />;
    };

    // Форматирование размера файла
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Форматирование даты
    const formatDate = (dateValue: string | number) => {
        let date: Date;
        if (typeof dateValue === 'number') {
            // Если это timestamp в секундах, конвертируем в миллисекунды
            date = new Date(dateValue < 1000000000000 ? dateValue * 1000 : dateValue);
        } else {
            date = new Date(dateValue);
        }
        
        if (isNaN(date.getTime())) {
            return 'Неизвестно';
        }
        
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Сегодня';
        if (diffDays === 2) return 'Вчера';
        if (diffDays <= 7) return `${diffDays} дн. назад`;
        
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Обработка клика по папке
    const handleFolderClick = (folder: FileItem) => {
        const newExpanded = new Set(expandedFolders);
        
        if (expandedFolders.has(folder.path)) {
            newExpanded.delete(folder.path);
        } else {
            newExpanded.add(folder.path);
        }
        
        setExpandedFolders(newExpanded);
        onDirectoryChange(folder.path);
    };

    // Обработка клика по файлу
    const handleFileClick = (file: FileItem) => {
        if (file.is_directory) {
            handleFolderClick(file);
        } else {
            onFileSelect(file);
        }
    };

    return (
        <div className="terminal-file-explorer">
            <div className="explorer-header">
                <div className="current-path">
                    <Code className="path-icon" size={14} />
                    <span className="path-text">{currentPath}</span>
                </div>
                {searchQuery && (
                    <div className="search-indicator">
                        <span className="search-count">{filteredFiles.length} найдено</span>
                    </div>
                )}
            </div>

            <div className="files-list">
                {filteredFiles.map((file) => (
                    <div
                        key={file.path}
                        className={`file-item ${selectedFile?.path === file.path ? 'selected' : ''} ${file.is_directory ? 'directory' : 'file'}`}
                        onClick={() => handleFileClick(file)}
                    >
                        <div className="file-main">
                            <div className="file-name-section">
                                {file.is_directory && (
                                    <div className="folder-toggle">
                                        {expandedFolders.has(file.path) ? 
                                            <ChevronDown size={12} /> : 
                                            <ChevronRight size={12} />
                                        }
                                    </div>
                                )}
                                {getFileIcon(file)}
                                <span className="file-name">{file.name}</span>
                            </div>
                            
                            <div className="file-meta">
                                {!file.is_directory && (
                                    <span className="file-size">{formatFileSize(file.size)}</span>
                                )}
                                {file.modified && (
                                    <span className="file-date">{formatDate(file.modified)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredFiles.length === 0 && (
                    <div className="empty-state">
                        <File className="empty-icon" size={24} />
                        <p className="empty-text">
                            {searchQuery ? 'Файлы не найдены' : 'Папка пуста'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TerminalFileExplorer;
