import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileItem } from '../../types/FileTypes';
import { WebSocketService } from '../../services/WebSocketService';
import { ContextMenu, ContextMenuItem } from '../ContextMenu/ContextMenu';
import './DraggableFileItem.css';

interface DraggableFileItemProps {
    file: FileItem;
    onSelect: (file: FileItem) => void;
    onMove?: (sourceFile: FileItem, targetPath: string) => void;
    onDelete?: (file: FileItem) => void;
    onRename?: (file: FileItem, newName: string) => void;
    onCopy?: (file: FileItem) => void;
    onInfo?: (file: FileItem) => void;
    onPreview?: (file: FileItem) => void;
    isSelected: boolean;
}

export const DraggableFileItem: React.FC<DraggableFileItemProps> = ({
    file,
    onSelect,
    onMove,
    onDelete,
    onRename,
    onCopy,
    onInfo,
    onPreview,
    isSelected
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDropTarget, setIsDropTarget] = useState(false);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, visible: boolean}>({
        x: 0, y: 0, visible: false
    });
    const wsService = WebSocketService.getInstance();

    const handleDragStart = (e: React.DragEvent) => {
        if (file.is_directory) return; // Пока разрешаем перетаскивать только файлы
        
        setIsDragging(true);
        e.dataTransfer.setData('application/json', JSON.stringify(file));
        e.dataTransfer.effectAllowed = 'move';
        
        // Добавляем визуальный эффект
        e.dataTransfer.setDragImage(e.currentTarget as Element, 20, 20);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!file.is_directory) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);
    };

    const handleDragLeave = () => {
        setIsDropTarget(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropTarget(false);
        
        if (!file.is_directory) return;
        
        try {
            const draggedFileData = e.dataTransfer.getData('application/json');
            const draggedFile: FileItem = JSON.parse(draggedFileData);
            
            if (draggedFile.path === file.path) return; // Нельзя переместить в ту же папку
            
            const targetPath = `${file.path}/${draggedFile.name}`;
            
            // Отправляем команду на перемещение через WebSocket
            wsService.sendMessage('move', {
                operation: 'move',
                source_path: draggedFile.path,
                target_path: targetPath
            });
            
            onMove?.(draggedFile, targetPath);
            
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(file);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (file.is_directory) {
            // При двойном клике на папку - открываем её
            onSelect(file);
        } else {
            // При двойном клике на файл - показываем информацию
            onInfo?.(file);
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true
        });
    };

    const getContextMenuItems = (): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [
            {
                id: 'open',
                label: file.is_directory ? 'Открыть папку' : 'Открыть файл',
                icon: '📂',
                onClick: () => onSelect(file)
            }
        ];

        // Добавляем предварительный просмотр только для файлов
        if (!file.is_directory && onPreview) {
            items.push({
                id: 'preview',
                label: 'Предварительный просмотр',
                icon: '👁️',
                onClick: () => onPreview(file)
            });
        }

        if (onCopy) {
            items.push({
                id: 'copy',
                label: 'Копировать',
                icon: '📋',
                onClick: () => onCopy(file)
            });
        }

        if (onRename) {
            items.push({
                id: 'rename',
                label: 'Переименовать',
                icon: '✏️',
                onClick: () => {
                    const newName = window.prompt('Новое имя:', file.name);
                    if (newName && newName !== file.name) {
                        onRename(file, newName);
                    }
                }
            });
        }

        if (onDelete) {
            items.push({
                id: 'delete',
                label: 'Удалить',
                icon: '🗑️',
                danger: true,
                onClick: () => {
                    if (window.confirm(`Вы уверены, что хотите удалить ${file.name}?`)) {
                        onDelete(file);
                    }
                }
            });
        }

        return items;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number | string): string => {
        return new Date(timestamp).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = () => {
        if (file.is_directory) return '📁';
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        const iconMap: { [key: string]: string } = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊',
            'ppt': '📈', 'pptx': '📈',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
            'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'js': '💛', 'ts': '💙', 'jsx': '💛', 'tsx': '💙',
            'py': '🐍',
            'html': '🌐', 'css': '🎨',
            'json': '⚙️',
            'md': '📝',
            'txt': '📄'
        };
        
        return iconMap[extension || ''] || '📄';
    };

    return (
        <>
            <motion.div
                className={`draggable-file-item ${file.is_directory ? 'directory' : 'file'} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleRightClick}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                transition={{ duration: 0.2 }}
            >
                <div 
                    draggable={!file.is_directory}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="file-content"
                >
                    <div className="file-icon">
                        {getFileIcon()}
                    </div>
                    
                    <div className="file-details">
                        <div className="file-name" title={file.name}>
                            {file.name}
                        </div>
                        <div className="file-meta">
                            {!file.is_directory && (
                                <span className="file-size">
                                    {formatFileSize(file.size)}
                                </span>
                            )}
                            {file.modified && (
                                <span className="file-date">
                                    {formatDate(file.modified)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {file.is_directory && (
                        <div className="directory-indicator">
                            →
                        </div>
                    )}
                </div>
                
                {isDropTarget && (
                    <motion.div 
                        className="drop-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        Перенести сюда
                    </motion.div>
                )}
            </motion.div>
            
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                visible={contextMenu.visible}
                items={getContextMenuItems()}
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            />
        </>
    );
};
