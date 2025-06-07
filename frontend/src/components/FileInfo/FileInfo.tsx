import React from 'react';
import { FileItem } from '../../types/FileTypes';
import './FileInfo.css';

interface FileInfoProps {
    file: FileItem | null;
    onClose: () => void;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file, onClose }) => {
    if (!file) return null;

    const formatSize = (size: number): string => {
        if (size === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toUpperCase() || 'Без расширения';
    };

    const getFileIcon = (file: FileItem): string => {
        if (file.is_directory) return '📁';
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'txt': return '📄';
            case 'js': case 'jsx': case 'ts': case 'tsx': return '📜';
            case 'html': case 'htm': return '🌐';
            case 'css': case 'scss': case 'sass': return '🎨';
            case 'json': return '📋';
            case 'py': return '🐍';
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return '🖼️';
            case 'mp4': case 'avi': case 'mov': return '🎬';
            case 'mp3': case 'wav': case 'flac': return '🎵';
            case 'pdf': return '📕';
            case 'zip': case 'rar': case '7z': return '🗜️';
            default: return '📄';
        }
    };

    return (
        <div className="file-info-overlay" onClick={onClose}>
            <div className="file-info-modal" onClick={(e) => e.stopPropagation()}>
                <div className="file-info-header">
                    <div className="file-info-icon">{getFileIcon(file)}</div>
                    <div className="file-info-title">
                        <h3>{file.name}</h3>
                        <span className="file-info-type">
                            {file.is_directory ? 'Папка' : getFileExtension(file.name)}
                        </span>
                    </div>
                    <button className="file-info-close" onClick={onClose}>×</button>
                </div>
                
                <div className="file-info-content">
                    <div className="file-info-section">
                        <h4>Общая информация</h4>
                        <div className="file-info-row">
                            <span className="file-info-label">Название:</span>
                            <span className="file-info-value">{file.name}</span>
                        </div>
                        <div className="file-info-row">
                            <span className="file-info-label">Путь:</span>
                            <span className="file-info-value">{file.path}</span>
                        </div>
                        <div className="file-info-row">
                            <span className="file-info-label">Тип:</span>
                            <span className="file-info-value">
                                {file.is_directory ? 'Папка' : 'Файл'}
                            </span>
                        </div>
                        {!file.is_directory && (
                            <div className="file-info-row">
                                <span className="file-info-label">Размер:</span>
                                <span className="file-info-value">{formatSize(file.size)}</span>
                            </div>
                        )}
                    </div>

                    <div className="file-info-section">
                        <h4>Даты</h4>
                        <div className="file-info-row">
                            <span className="file-info-label">Изменен:</span>
                            <span className="file-info-value">{file.modified ? formatDate(file.modified.toString()) : 'Неизвестно'}</span>
                        </div>
                    </div>

                    {!file.is_directory && (
                        <div className="file-info-section">
                            <h4>Действия</h4>
                            <div className="file-info-actions">
                                <button className="file-info-action-btn" onClick={() => {
                                    navigator.clipboard.writeText(file.path + '/' + file.name);
                                }}>
                                    📋 Копировать путь
                                </button>
                                <button className="file-info-action-btn" onClick={() => {
                                    navigator.clipboard.writeText(file.name);
                                }}>
                                    📝 Копировать имя
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
