import React, { useState, useEffect } from 'react';
import './FilePreview.css';
import { FileItem } from '../../types/FileTypes';

interface FilePreviewProps {
    file: FileItem | null;
    onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (file && !file.is_directory) {
            loadFileContent();
        }
    }, [file]);

    const loadFileContent = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            // Определяем тип файла для предварительного просмотра
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            
            if (isTextFile(extension)) {
                const response = await fetch(`/api/v1/file-content/?path=${encodeURIComponent(file.path)}`);
                if (response.ok) {
                    const text = await response.text();
                    setContent(text);
                } else {
                    setError('Не удалось загрузить содержимое файла');
                }
            } else if (isImageFile(extension)) {
                setContent(`data:image/${extension};base64,${await getBase64Content(file.path)}`);
            } else {
                setError('Предварительный просмотр не поддерживается для этого типа файла');
            }
        } catch (err) {
            setError('Ошибка загрузки файла');
        } finally {
            setLoading(false);
        }
    };

    const isTextFile = (extension: string): boolean => {
        const textExtensions = [
            'txt', 'md', 'js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 
            'xml', 'yml', 'yaml', 'csv', 'sql', 'sh', 'bat', 'log', 'ini', 'cfg'
        ];
        return textExtensions.includes(extension);
    };

    const isImageFile = (extension: string): boolean => {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
        return imageExtensions.includes(extension);
    };

    const getBase64Content = async (filePath: string): Promise<string> => {
        // Заглушка - в реальном приложении здесь будет API call
        return '';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleString('ru-RU');
    };

    const getFileIcon = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        const iconMap: { [key: string]: string } = {
            // Документы
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊',
            'ppt': '📋', 'pptx': '📋',
            'txt': '📄',
            'md': '📝',
            
            // Код
            'js': '💛', 'ts': '💙', 'tsx': '💙', 'jsx': '💛',
            'py': '🐍',
            'html': '🌐',
            'css': '🎨',
            'json': '📋',
            'xml': '📋',
            
            // Изображения
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️',
            'gif': '🖼️', 'svg': '🖼️', 'bmp': '🖼️',
            
            // Архивы
            'zip': '📦', 'rar': '📦', 'tar': '📦', 'gz': '📦',
            
            // Видео
            'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'mkv': '🎥',
            
            // Аудио
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
        };
        
        return iconMap[extension] || '📄';
    };

    const renderContent = () => {
        if (!file) return null;

        if (loading) {
            return (
                <div className="preview-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка содержимого...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="preview-error">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                </div>
            );
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        if (isImageFile(extension)) {
            return (
                <div className="preview-image">
                    <img src={content} alt={file.name} />
                </div>
            );
        }

        if (isTextFile(extension)) {
            return (
                <div className="preview-text">
                    <pre className={`language-${extension}`}>
                        <code>{content}</code>
                    </pre>
                </div>
            );
        }

        return (
            <div className="preview-unsupported">
                <div className="file-icon-large">{getFileIcon(file.name)}</div>
                <p>Предварительный просмотр не поддерживается</p>
                <small>Файл можно скачать для просмотра в внешнем приложении</small>
            </div>
        );
    };

    if (!file) return null;

    return (
        <div className="file-preview-overlay" onClick={onClose}>
            <div className="file-preview" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                    <div className="file-info">
                        <span className="file-icon">{getFileIcon(file.name)}</span>
                        <div className="file-details">
                            <h3 className="file-name">{file.name}</h3>
                            <div className="file-meta">
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                <span className="file-date">Изменен: {file.modified ? formatDate(file.modified) : 'Неизвестно'}</span>
                            </div>
                        </div>
                    </div>
                    <button className="preview-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="preview-content">
                    {renderContent()}
                </div>

                <div className="preview-actions">
                    <button className="action-btn download-btn">
                        📥 Скачать
                    </button>
                    <button className="action-btn edit-btn">
                        ✏️ Редактировать
                    </button>
                    <button className="action-btn share-btn">
                        🔗 Поделиться
                    </button>
                </div>
            </div>
        </div>
    );
};
