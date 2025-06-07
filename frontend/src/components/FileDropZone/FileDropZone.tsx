import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FileDropZone.css';

interface FileDropZoneProps {
    onFilesSelected: (files: FileList) => void;
    currentPath: string;
    children: React.ReactNode;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
    onFilesSelected,
    currentPath,
    children
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev + 1);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(prev => prev - 1);
        if (dragCounter === 1) {
            setIsDragOver(false);
        }
    }, [dragCounter]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setDragCounter(0);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsUploading(true);
            setUploadProgress(0);
            
            try {
                // Симуляция прогресса загрузки
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                await onFilesSelected(e.dataTransfer.files);
                
                clearInterval(progressInterval);
                setUploadProgress(100);
                
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 1000);
            } catch (error) {
                setIsUploading(false);
                setUploadProgress(0);
                console.error('Upload error:', error);
            }
            
            e.dataTransfer.clearData();
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            setUploadProgress(0);
            
            try {
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                await onFilesSelected(e.target.files);
                
                clearInterval(progressInterval);
                setUploadProgress(100);
                
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 1000);
            } catch (error) {
                setIsUploading(false);
                setUploadProgress(0);
                console.error('Upload error:', error);
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            ref={dropZoneRef}
            className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />
            
            {children}
            
            <AnimatePresence>
                {isDragOver && (
                    <motion.div 
                        className="drop-overlay"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div 
                            className="drop-message"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <motion.div 
                                className="drop-icon"
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                📁
                            </motion.div>
                            <div className="drop-text">
                                Отпустите файлы для загрузки в<br />
                                <strong>{currentPath}</strong>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isUploading && (
                    <motion.div 
                        className="upload-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="upload-progress">
                            <div className="upload-icon">⬆️</div>
                            <div className="upload-text">
                                Загрузка файлов... {uploadProgress}%
                            </div>
                            <div className="progress-bar">
                                <motion.div 
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка для ручного выбора файлов */}
            <motion.button
                className="manual-upload-btn"
                onClick={triggerFileInput}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                📤 Выбрать файлы
            </motion.button>
        </div>
    );
};
