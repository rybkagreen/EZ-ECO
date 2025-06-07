import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Cpu, Zap, BarChart3, TrendingUp } from 'lucide-react';
import './PerformanceMonitor.css';

interface PerformanceMetrics {
    renderCount: number;
    renderTime: number;
    memoryUsage: number;
    fileOperations: number;
    averageLoadTime: number;
    lastUpdate: number;
}

interface PerformanceMonitorProps {
    renderCount?: number;
    renderTime?: number;
    memoryUsage?: number;
    fileOperations?: number;
    averageLoadTime?: number;
    onOptimizationSuggestion?: (suggestion: string) => void;
    enabled?: boolean;
    compact?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
    renderCount: externalRenderCount,
    renderTime: externalRenderTime,
    memoryUsage: externalMemoryUsage,
    fileOperations: externalFileOperations,
    averageLoadTime: externalAverageLoadTime,
    onOptimizationSuggestion,
    enabled = true,
    compact = false
}) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderCount: 0,
        renderTime: 0,
        memoryUsage: 0,
        fileOperations: 0,
        averageLoadTime: 0,
        lastUpdate: Date.now()
    });
    const [isVisible, setIsVisible] = useState(false);
    const [performanceScore, setPerformanceScore] = useState(100);

    // Используем внешние метрики если они переданы, иначе внутренние
    const currentMetrics = {
        renderCount: externalRenderCount ?? metrics.renderCount,
        renderTime: externalRenderTime ?? metrics.renderTime,
        memoryUsage: externalMemoryUsage ?? metrics.memoryUsage,
        fileOperations: externalFileOperations ?? metrics.fileOperations,
        averageLoadTime: externalAverageLoadTime ?? metrics.averageLoadTime,
        lastUpdate: metrics.lastUpdate
    };

    // Мониторинг производительности
    const measurePerformance = useCallback(() => {
        if (!enabled) return;

        const startTime = performance.now();
        
        // Симуляция измерения метрик
        const newMetrics: PerformanceMetrics = {
            renderCount: metrics.renderCount + 1,
            renderTime: performance.now() - startTime,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            fileOperations: metrics.fileOperations,
            averageLoadTime: (metrics.averageLoadTime + (performance.now() - startTime)) / 2,
            lastUpdate: Date.now()
        };

        setMetrics(newMetrics);
        
        // Расчет общего скора производительности
        const score = Math.max(0, 100 - (newMetrics.renderTime * 2) - (newMetrics.averageLoadTime / 10));
        setPerformanceScore(Math.round(score));

        // Автоматические предложения по оптимизации
        if (newMetrics.renderTime > 50 && onOptimizationSuggestion) {
            onOptimizationSuggestion('Обнаружена медленная отрисовка. Рекомендуется оптимизация компонентов.');
        }
        if (newMetrics.memoryUsage > 50000000 && onOptimizationSuggestion) {
            onOptimizationSuggestion('Высокое использование памяти. Рекомендуется очистка кешей.');
        }
    }, [enabled, metrics, onOptimizationSuggestion]);

    // Обновление файловых операций
    const incrementFileOperations = useCallback(() => {
        setMetrics(prev => ({
            ...prev,
            fileOperations: prev.fileOperations + 1
        }));
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(measurePerformance, 1000);
        return () => clearInterval(interval);
    }, [measurePerformance, enabled]);

    // Глобальный доступ к счетчику операций
    useEffect(() => {
        (window as any).incrementFileOperations = incrementFileOperations;
        return () => {
            delete (window as any).incrementFileOperations;
        };
    }, [incrementFileOperations]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getPerformanceStatus = () => {
        if (performanceScore >= 80) return { status: 'excellent', color: '#22c55e', icon: Zap };
        if (performanceScore >= 60) return { status: 'good', color: '#3b82f6', icon: TrendingUp };
        if (performanceScore >= 40) return { status: 'fair', color: '#f59e0b', icon: BarChart3 };
        return { status: 'poor', color: '#ef4444', icon: Activity };
    };

    if (!enabled) return null;

    const perfStatus = getPerformanceStatus();
    const StatusIcon = perfStatus.icon;

    if (compact) {
        return (
            <motion.div 
                className="performance-monitor-compact"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsVisible(!isVisible)}
            >
                <StatusIcon size={16} style={{ color: perfStatus.color }} />
                <span style={{ color: perfStatus.color }}>{performanceScore}</span>
                
                <AnimatePresence>
                    {isVisible && (
                        <motion.div 
                            className="performance-tooltip"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <div className="perf-metric">
                                <Clock size={12} />
                                <span>{currentMetrics.renderTime.toFixed(1)}ms</span>
                            </div>
                            <div className="perf-metric">
                                <Cpu size={12} />
                                <span>{formatBytes(currentMetrics.memoryUsage)}</span>
                            </div>
                            <div className="perf-metric">
                                <Activity size={12} />
                                <span>{currentMetrics.fileOperations} ops</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="performance-monitor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="performance-header">
                <StatusIcon size={18} style={{ color: perfStatus.color }} />
                <span className="performance-title">Performance</span>
                <div 
                    className="performance-score"
                    style={{ backgroundColor: perfStatus.color }}
                >
                    {performanceScore}
                </div>
            </div>

            <div className="performance-metrics">
                <div className="metric-item">
                    <div className="metric-icon">
                        <Clock size={14} />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Render Time</span>
                        <span className="metric-value">{currentMetrics.renderTime.toFixed(1)}ms</span>
                    </div>
                </div>

                <div className="metric-item">
                    <div className="metric-icon">
                        <Cpu size={14} />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Memory</span>
                        <span className="metric-value">{formatBytes(currentMetrics.memoryUsage)}</span>
                    </div>
                </div>

                <div className="metric-item">
                    <div className="metric-icon">
                        <Activity size={14} />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Operations</span>
                        <span className="metric-value">{currentMetrics.fileOperations}</span>
                    </div>
                </div>

                <div className="metric-item">
                    <div className="metric-icon">
                        <BarChart3 size={14} />
                    </div>
                    <div className="metric-details">
                        <span className="metric-label">Avg Load</span>
                        <span className="metric-value">{currentMetrics.averageLoadTime.toFixed(1)}ms</span>
                    </div>
                </div>
            </div>

            <motion.div 
                className="performance-bar"
                initial={{ width: 0 }}
                animate={{ width: `${performanceScore}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ backgroundColor: perfStatus.color }}
            />
        </motion.div>
    );
};

export default PerformanceMonitor;
