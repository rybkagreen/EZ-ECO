import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './FilePreviewCache.css';

export interface PreviewData {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  lastModified: number;
  content: string | ArrayBuffer | null;
  thumbnail?: string;
  metadata?: Record<string, any>;
  dimensions?: { width: number; height: number };
  duration?: number;
  cached: boolean;
  cacheTime: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum number of cached items
  maxMemory: number; // Maximum memory usage in MB
  ttl: number; // Time to live in milliseconds
  enableThumbnails: boolean;
  thumbnailSize: number;
  preloadStrategy: 'none' | 'adjacent' | 'intelligent';
  compressionLevel: number;
}

export interface FilePreviewCacheProps {
  config?: Partial<CacheConfig>;
  onCacheUpdate?: (stats: CacheStats) => void;
  onPreviewGenerated?: (preview: PreviewData) => void;
  onError?: (error: Error, filePath: string) => void;
}

export interface CacheStats {
  totalItems: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  totalSize: number;
  oldestItem: number;
  newestItem: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 100,
  maxMemory: 50, // 50MB
  ttl: 30 * 60 * 1000, // 30 minutes
  enableThumbnails: true,
  thumbnailSize: 200,
  preloadStrategy: 'intelligent',
  compressionLevel: 0.8,
};

class FilePreviewCacheManager {
  private cache: Map<string, PreviewData> = new Map();
  private accessOrder: string[] = [];
  private config: CacheConfig;
  private stats: CacheStats = {
    totalItems: 0,
    memoryUsage: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    totalSize: 0,
    oldestItem: 0,
    newestItem: 0,
  };
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  async generatePreview(file: File): Promise<PreviewData> {
    const id = this.generateId(file);
    const existing = this.get(id);
    
    if (existing && !this.isExpired(existing)) {
      this.hits++;
      this.updateAccessOrder(id);
      return existing;
    }

    this.misses++;
    const preview = await this.createPreview(file);
    this.set(id, preview);
    
    return preview;
  }

  private async createPreview(file: File): Promise<PreviewData> {
    const preview: PreviewData = {
      id: this.generateId(file),
      filePath: file.name,
      fileName: file.name,
      fileSize: file.size,
      fileType: this.getFileType(file.type),
      mimeType: file.type,
      lastModified: file.lastModified,
      content: null,
      cached: false,
      cacheTime: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    try {
      // Generate content based on file type
      if (file.type.startsWith('image/')) {
        preview.content = await this.generateImagePreview(file);
        preview.dimensions = await this.getImageDimensions(file);
        if (this.config.enableThumbnails) {
          preview.thumbnail = await this.generateThumbnail(file);
        }
      } else if (file.type.startsWith('video/')) {
        preview.content = await this.generateVideoPreview(file);
        preview.duration = await this.getVideoDuration(file);
        if (this.config.enableThumbnails) {
          preview.thumbnail = await this.generateVideoThumbnail(file);
        }
      } else if (file.type.startsWith('audio/')) {
        preview.content = await this.generateAudioPreview(file);
        preview.duration = await this.getAudioDuration(file);
        preview.metadata = await this.getAudioMetadata(file);
      } else if (file.type.startsWith('text/') || this.isTextFile(file.type)) {
        preview.content = await this.generateTextPreview(file);
      } else if (file.type === 'application/pdf') {
        preview.content = await this.generatePDFPreview(file);
        if (this.config.enableThumbnails) {
          preview.thumbnail = await this.generatePDFThumbnail(file);
        }
      } else {
        preview.content = await this.generateGenericPreview(file);
      }

      preview.cached = true;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      preview.content = null;
    }

    return preview;
  }

  private async generateImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async generateVideoPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(video.duration / 2, 10); // Seek to middle or 10s
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.config.thumbnailSize;
        canvas.height = (canvas.width * video.videoHeight) / video.videoWidth;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', this.config.compressionLevel));
      };
      
      video.onerror = reject;
      video.src = url;
    });
  }

  private async generateAudioPreview(file: File): Promise<string> {
    // Generate waveform or audio visualization
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Generate a simple waveform visualization
        ctx.fillStyle = '#3b82f6';
        for (let i = 0; i < canvas.width; i += 4) {
          const height = Math.random() * canvas.height;
          ctx.fillRect(i, (canvas.height - height) / 2, 2, height);
        }
      }
      
      resolve(canvas.toDataURL());
    });
  }

  private async generateTextPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        // Get first 500 characters for preview
        resolve(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private async generatePDFPreview(file: File): Promise<string> {
    // For PDF preview, you would typically use PDF.js
    // This is a simplified implementation
    return URL.createObjectURL(file);
  }

  private async generateGenericPreview(file: File): Promise<string> {
    return `File: ${file.name}\nSize: ${this.formatFileSize(file.size)}\nType: ${file.type}`;
  }

  private async generateThumbnail(file: File): Promise<string> {
    if (file.type.startsWith('image/')) {
      return this.resizeImage(file, this.config.thumbnailSize);
    }
    return '';
  }

  private async generateVideoThumbnail(file: File): Promise<string> {
    return this.generateVideoPreview(file);
  }

  private async generatePDFThumbnail(file: File): Promise<string> {
    // PDF thumbnail generation would require PDF.js
    return '';
  }

  private async resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', this.config.compressionLevel));
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = reject;
      audio.src = URL.createObjectURL(file);
    });
  }

  private async getAudioMetadata(file: File): Promise<Record<string, any>> {
    // Basic metadata extraction
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    };
  }

  private generateId(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  private getFileType(mimeType: string): string {
    const [type] = mimeType.split('/');
    return type || 'unknown';
  }

  private isTextFile(mimeType: string): boolean {
    const textTypes = [
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-yaml',
    ];
    return textTypes.includes(mimeType);
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private get(id: string): PreviewData | undefined {
    const item = this.cache.get(id);
    if (item) {
      item.accessCount++;
      item.lastAccessed = Date.now();
      this.updateAccessOrder(id);
    }
    return item;
  }

  private set(id: string, preview: PreviewData): void {
    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Check memory usage
    const estimatedSize = this.estimateSize(preview);
    if (this.stats.memoryUsage + estimatedSize > this.config.maxMemory * 1024 * 1024) {
      this.evictByMemory(estimatedSize);
    }

    this.cache.set(id, preview);
    this.updateAccessOrder(id);
    this.updateStats();
  }

  private updateAccessOrder(id: string): void {
    const index = this.accessOrder.indexOf(id);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(id);
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruId = this.accessOrder.shift()!;
      this.cache.delete(lruId);
      this.stats.evictions++;
    }
  }

  private evictByMemory(requiredSize: number): void {
    while (this.stats.memoryUsage + requiredSize > this.config.maxMemory * 1024 * 1024 && this.cache.size > 0) {
      this.evictLRU();
      this.updateStats();
    }
  }

  private estimateSize(preview: PreviewData): number {
    let size = 0;
    
    // Estimate content size
    if (typeof preview.content === 'string') {
      size += preview.content.length * 2; // UTF-16 encoding
    } else if (preview.content instanceof ArrayBuffer) {
      size += preview.content.byteLength;
    }
    
    // Estimate thumbnail size
    if (preview.thumbnail) {
      size += preview.thumbnail.length * 2;
    }
    
    // Add metadata overhead
    size += JSON.stringify(preview).length * 2;
    
    return size;
  }

  private isExpired(preview: PreviewData): boolean {
    return Date.now() - preview.cacheTime > this.config.ttl;
  }

  private updateStats(): void {
    this.stats.totalItems = this.cache.size;
    this.stats.hitRate = this.hits / (this.hits + this.misses) * 100;
    this.stats.missRate = this.misses / (this.hits + this.misses) * 100;
    
    let totalMemory = 0;
    let oldest = Date.now();
    let newest = 0;
    
    for (const preview of this.cache.values()) {
      totalMemory += this.estimateSize(preview);
      oldest = Math.min(oldest, preview.cacheTime);
      newest = Math.max(newest, preview.cacheTime);
    }
    
    this.stats.memoryUsage = totalMemory;
    this.stats.totalSize = totalMemory;
    this.stats.oldestItem = oldest;
    this.stats.newestItem = newest;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, preview] of this.cache.entries()) {
        if (this.isExpired(preview)) {
          this.cache.delete(id);
          const index = this.accessOrder.indexOf(id);
          if (index > -1) {
            this.accessOrder.splice(index, 1);
          }
        }
      }
      this.updateStats();
    }, 60000); // Clean up every minute
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
    this.stats.evictions = 0;
    this.updateStats();
  }

  invalidate(id: string): void {
    this.cache.delete(id);
    const index = this.accessOrder.indexOf(id);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.updateStats();
  }
}

const FilePreviewCache: React.FC<FilePreviewCacheProps> = ({
  config,
  onCacheUpdate,
  onPreviewGenerated,
  onError,
}) => {
  const [cacheManager] = useState(() => new FilePreviewCacheManager(config));
  const [stats, setStats] = useState<CacheStats>(cacheManager.getStats());

  const updateStats = useCallback(() => {
    const newStats = cacheManager.getStats();
    setStats(newStats);
    onCacheUpdate?.(newStats);
  }, [cacheManager, onCacheUpdate]);

  useEffect(() => {
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const generatePreview = useCallback(async (file: File): Promise<PreviewData> => {
    try {
      const preview = await cacheManager.generatePreview(file);
      onPreviewGenerated?.(preview);
      updateStats();
      return preview;
    } catch (error) {
      onError?.(error as Error, file.name);
      throw error;
    }
  }, [cacheManager, onPreviewGenerated, onError, updateStats]);

  const clearCache = useCallback(() => {
    cacheManager.clear();
    updateStats();
  }, [cacheManager, updateStats]);

  const invalidateFile = useCallback((fileId: string) => {
    cacheManager.invalidate(fileId);
    updateStats();
  }, [cacheManager, updateStats]);

  // Export cache methods for external use
  const cacheApi = useMemo(() => ({
    generatePreview,
    clearCache,
    invalidateFile,
    getStats: () => stats,
  }), [generatePreview, clearCache, invalidateFile, stats]);

  return (
    <div className="file-preview-cache">
      <div className="cache-stats">
        <h3>Cache Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <label>Items:</label>
            <span>{stats.totalItems}</span>
          </div>
          <div className="stat-item">
            <label>Memory:</label>
            <span>{(stats.memoryUsage / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <div className="stat-item">
            <label>Hit Rate:</label>
            <span>{stats.hitRate.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <label>Evictions:</label>
            <span>{stats.evictions}</span>
          </div>
        </div>
        <button onClick={clearCache} className="clear-cache-btn">
          Clear Cache
        </button>
      </div>
    </div>
  );
};

export { FilePreviewCacheManager };
export default FilePreviewCache;
