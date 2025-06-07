import React from 'react';
import { FileItem } from '../../types/FileTypes';
import './FileStats.css';

interface FileStatsProps {
    files: FileItem[];
    currentPath: string;
}

export const FileStats: React.FC<FileStatsProps> = ({ files, currentPath }) => {
    const totalFiles = files.filter(file => !file.is_directory).length;
    const totalFolders = files.filter(file => file.is_directory).length;
    const totalSize = files
        .filter(file => !file.is_directory)
        .reduce((sum, file) => sum + file.size, 0);

    const formatSize = (size: number): string => {
        if (size === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(size) / Math.log(k));
        return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileTypeStats = () => {
        const stats: { [key: string]: number } = {};
        files.filter(file => !file.is_directory).forEach(file => {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'no-ext';
            stats[extension] = (stats[extension] || 0) + 1;
        });
        return Object.entries(stats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Топ 5 типов файлов
    };

    const fileTypeStats = getFileTypeStats();

    return (
        <div className="file-stats">
            <div className="stats-header">
                <h4>📊 Статистика</h4>
                <span className="stats-path">{currentPath}</span>
            </div>
            
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-icon">📄</div>
                    <div className="stat-content">
                        <div className="stat-number">{totalFiles}</div>
                        <div className="stat-label">Файлов</div>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <div className="stat-number">{totalFolders}</div>
                        <div className="stat-label">Папок</div>
                    </div>
                </div>
                
                <div className="stat-item">
                    <div className="stat-icon">💾</div>
                    <div className="stat-content">
                        <div className="stat-number">{formatSize(totalSize)}</div>
                        <div className="stat-label">Общий размер</div>
                    </div>
                </div>
            </div>

            {fileTypeStats.length > 0 && (
                <div className="file-types">
                    <h5>📋 Типы файлов</h5>
                    <div className="file-types-list">
                        {fileTypeStats.map(([ext, count]) => (
                            <div key={ext} className="file-type-item">
                                <span className="file-type-ext">.{ext}</span>
                                <span className="file-type-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
