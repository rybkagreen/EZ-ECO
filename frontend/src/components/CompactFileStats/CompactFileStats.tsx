import React from 'react';
import { FileText, FolderOpen, Clock, HardDrive } from 'lucide-react';
import './CompactFileStats.css';

interface CompactFileStatsProps {
    totalFiles: number;
    totalFolders: number;
    totalSize: string;
    lastModified: string;
}

export const CompactFileStats: React.FC<CompactFileStatsProps> = ({
    totalFiles,
    totalFolders,
    totalSize,
    lastModified
}) => {
    return (
        <div className="compact-file-stats">
            <div className="stats-item">
                <FileText className="stats-icon" size={14} />
                <span className="stats-value">{totalFiles}</span>
            </div>
            
            <div className="stats-item">
                <FolderOpen className="stats-icon" size={14} />
                <span className="stats-value">{totalFolders}</span>
            </div>
            
            <div className="stats-item">
                <HardDrive className="stats-icon" size={14} />
                <span className="stats-value">{totalSize}</span>
            </div>
            
            <div className="stats-item">
                <Clock className="stats-icon" size={14} />
                <span className="stats-value">{lastModified}</span>
            </div>
        </div>
    );
};

export default CompactFileStats;
