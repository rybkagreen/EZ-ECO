import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Keyboard } from 'lucide-react';
import { HotKey } from '../../hooks/useHotKeys';
import './HotKeysHelper.css';

interface HotKeysHelperProps {
    hotKeys: HotKey[];
    title?: string;
}

export const HotKeysHelper: React.FC<HotKeysHelperProps> = ({
    hotKeys,
    title = "Горячие клавиши"
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const formatHotKey = (hotKey: HotKey) => {
        const parts: string[] = [];
        
        if (hotKey.ctrl) parts.push('Ctrl');
        if (hotKey.alt) parts.push('Alt');
        if (hotKey.shift) parts.push('Shift');
        if (hotKey.meta) parts.push('⌘');
        
        parts.push(hotKey.key.toUpperCase());
        
        return parts.join(' + ');
    };

    const groupedHotKeys = hotKeys.reduce((groups, hotKey) => {
        const category = hotKey.description?.split(':')[0] || 'Общие';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(hotKey);
        return groups;
    }, {} as Record<string, HotKey[]>);

    return (
        <>
            {/* Кнопка помощи */}
            <motion.button
                className="hotkeys-trigger"
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Показать горячие клавиши (F1)"
            >
                <Keyboard size={16} />
            </motion.button>

            {/* Модальное окно */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="hotkeys-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="hotkeys-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="hotkeys-header">
                                <div className="hotkeys-title">
                                    <Keyboard size={20} />
                                    <h3>{title}</h3>
                                </div>
                                <button
                                    className="hotkeys-close"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="hotkeys-content">
                                {Object.entries(groupedHotKeys).map(([category, keys]) => (
                                    <motion.div
                                        key={category}
                                        className="hotkey-category"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <h4 className="category-title">{category}</h4>
                                        <div className="hotkey-list">
                                            {keys.map((hotKey, index) => (
                                                <motion.div
                                                    key={`${category}-${index}`}
                                                    className="hotkey-item"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <div className="hotkey-combo">
                                                        {formatHotKey(hotKey).split(' + ').map((part, i, arr) => (
                                                            <React.Fragment key={i}>
                                                                <kbd className="hotkey-key">{part}</kbd>
                                                                {i < arr.length - 1 && <span className="hotkey-plus">+</span>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <span className="hotkey-description">
                                                        {hotKey.description?.split(':')[1]?.trim() || hotKey.description}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="hotkeys-footer">
                                <p className="hotkeys-tip">
                                    💡 Нажмите <kbd>F1</kbd> чтобы открыть эту справку в любое время
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HotKeysHelper;
