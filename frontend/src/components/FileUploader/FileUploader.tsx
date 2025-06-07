import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { Upload, X, CheckCircle, AlertCircle, File, Image } from 'lucide-react';
import './FileUploader.css';

interface FileUploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
}

interface FileUploaderProps {
    onUpload?: (files: File[]) => Promise<void>;
    onFileStatusChange?: (fileId: string, status: FileUploadItem['status']) => void;
    acceptedTypes?: string[];
    maxFileSize?: number; // в MB
    maxFiles?: number;
    multiple?: boolean;
    disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onUpload,
    onFileStatusChange,
    acceptedTypes = ['*/*'],
    maxFileSize = 10,
    maxFiles = 10,
    multiple = true,
    disabled = false
}) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Проверка типа файла
    const isFileTypeAccepted = useCallback((file: File): boolean => {
        if (acceptedTypes.includes('*/*')) return true;
        
        return acceptedTypes.some(type => {
            if (type.endsWith('/*')) {
                const category = type.replace('/*', '');
                return file.type.startsWith(category);
            }
            return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
        });
    }, [acceptedTypes]);

    // Проверка размера файла
    const isFileSizeValid = useCallback((file: File): boolean => {
        const maxSizeBytes = maxFileSize * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }, [maxFileSize]);

    // Валидация файлов
    const validateFiles = useCallback((files: File[]): { valid: File[], invalid: Array<{file: File, reason: string}> } => {
        const valid: File[] = [];
        const invalid: Array<{file: File, reason: string}> = [];

        files.forEach(file => {
            if (!isFileTypeAccepted(file)) {
                invalid.push({ file, reason: 'Неподдерживаемый тип файла' });
            } else if (!isFileSizeValid(file)) {
                invalid.push({ file, reason: `Файл превышает максимальный размер ${maxFileSize}MB` });
            } else if (!multiple && valid.length >= 1) {
                invalid.push({ file, reason: 'Можно загружать только один файл' });
            } else if (valid.length >= maxFiles) {
                invalid.push({ file, reason: `Превышено максимальное количество файлов (${maxFiles})` });
            } else {
                valid.push(file);
            }
        });

        return { valid, invalid };
    }, [isFileTypeAccepted, isFileSizeValid, multiple, maxFiles]);

    // Обработка выбора файлов
    const handleFiles = useCallback(async (files: FileList | File[]) => {
        if (disabled) return;

        const fileArray = Array.from(files);
        const { valid, invalid } = validateFiles(fileArray);

        // Добавляем валидные файлы в список загрузки
        const newUploadItems: FileUploadItem[] = valid.map(file => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            status: 'pending',
            progress: 0
        }));

        // Добавляем невалидные файлы как ошибки
        const invalidItems: FileUploadItem[] = invalid.map(({ file, reason }) => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            status: 'error',
            progress: 0,
            error: reason
        }));

        setUploadItems(prev => [...prev, ...newUploadItems, ...invalidItems]);

        // Запускаем загрузку валидных файлов
        if (valid.length > 0 && onUpload) {
            try {
                // Обновляем статус на "uploading"
                setUploadItems(prev => prev.map(item => 
                    newUploadItems.find(newItem => newItem.id === item.id)
                        ? { ...item, status: 'uploading' as const }
                        : item
                ));

                await onUpload(valid);

                // Обновляем статус на "completed"
                setUploadItems(prev => prev.map(item => 
                    newUploadItems.find(newItem => newItem.id === item.id)
                        ? { ...item, status: 'completed' as const, progress: 100 }
                        : item
                ));
            } catch (error) {
                // Обновляем статус на "error"
                setUploadItems(prev => prev.map(item => 
                    newUploadItems.find(newItem => newItem.id === item.id)
                        ? { ...item, status: 'error' as const, error: error instanceof Error ? error.message : 'Ошибка загрузки' }
                        : item
                ));
            }
        }
    }, [disabled, validateFiles, onUpload]);

    // Drag & Drop handlers
    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragActive(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [disabled, handleFiles]);

    // Click handler для input
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Очищаем input для возможности повторного выбора того же файла
        e.target.value = '';
    }, [handleFiles]);

    // Удаление файла из списка
    const removeFile = useCallback((id: string) => {
        setUploadItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Очистка всех файлов
    const clearAll = useCallback(() => {
        setUploadItems([]);
    }, []);

    // Получение иконки файла
    const getFileIcon = useCallback((file: File) => {
        if (file.type.startsWith('image/')) {
            return <Image size={16} />;
        }
        return <File size={16} />;
    }, []);

    // Форматирование размера файла
    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }, []);

    const getStatusIcon = useCallback((status: FileUploadItem['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} className="status-icon success" />;
            case 'error':
                return <AlertCircle size={16} className="status-icon error" />;
            case 'uploading':
                return <div className="status-icon uploading">⟳</div>;
            default:
                return <div className="status-icon pending">⏱</div>;
        }
    }, []);

    return (
        <div className={`file-uploader ${disabled ? 'disabled' : ''}`}>
            <div
                className={`drop-zone ${isDragActive ? 'active' : ''} ${uploadItems.length > 0 ? 'has-files' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <div className="drop-zone-content">
                    <Upload size={48} className="upload-icon" />
                    <div className="drop-zone-text">
                        <h3>Перетащите файлы сюда</h3>
                        <p>или нажмите для выбора</p>
                    </div>
                    <div className="upload-info">
                        <span>Максимальный размер: {maxFileSize}MB</span>
                        {!multiple && <span>• Один файл</span>}
                        {maxFiles > 1 && <span>• До {maxFiles} файлов</span>}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />
            </div>

            {uploadItems.length > 0 && (
                <div className="upload-list">
                    <div className="upload-list-header">
                        <h4>Файлы ({uploadItems.length})</h4>
                        <button
                            className="clear-all-btn"
                            onClick={clearAll}
                            type="button"
                        >
                            Очистить все
                        </button>
                    </div>

                    <div className="upload-items">
                        {uploadItems.map(item => (
                            <div key={item.id} className={`upload-item ${item.status}`}>
                                <div className="file-info">
                                    <div className="file-icon">
                                        {getFileIcon(item.file)}
                                    </div>
                                    <div className="file-details">
                                        <div className="file-name">{item.file.name}</div>
                                        <div className="file-size">{formatFileSize(item.file.size)}</div>
                                        {item.error && (
                                            <div className="file-error">{item.error}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="file-status">
                                    {getStatusIcon(item.status)}
                                    <button
                                        className="remove-file-btn"
                                        onClick={() => removeFile(item.id)}
                                        type="button"
                                        aria-label="Удалить файл"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {item.status === 'uploading' && (
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
