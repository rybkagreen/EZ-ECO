import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import './PanelResizer.css';

interface PanelResizerProps {
    direction: 'horizontal' | 'vertical';
    onResize?: (delta: number) => void;
    disabled?: boolean;
    minSize?: number;
    maxSize?: number;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
    direction,
    onResize,
    disabled = false,
    minSize = 200,
    maxSize = 800
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const resizerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;
        
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = direction === 'horizontal' 
                ? moveEvent.clientX - dragStart.x
                : moveEvent.clientY - dragStart.y;
            
            onResize?.(delta);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }, [direction, dragStart, onResize, disabled]);

    return (
        <motion.div
            ref={resizerRef}
            className={`panel-resizer ${direction} ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
            onMouseDown={handleMouseDown}
            whileHover={!disabled ? { scale: 1.1 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            transition={{ duration: 0.1 }}
        >
            <div className="resizer-handle">
                <div className="resizer-grip">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="grip-dot"
                            initial={{ scale: 0.8, opacity: 0.6 }}
                            animate={isDragging ? 
                                { scale: 1.2, opacity: 1 } : 
                                { scale: 0.8, opacity: 0.6 }
                            }
                            transition={{ delay: i * 0.05 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default PanelResizer;
