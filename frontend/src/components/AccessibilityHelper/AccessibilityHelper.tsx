import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Accessibility, 
    Eye, 
    EyeOff, 
    Type, 
    MousePointer, 
    Keyboard,
    Volume2,
    VolumeX,
    Contrast,
    ZoomIn,
    Settings
} from 'lucide-react';
import './AccessibilityHelper.css';

export interface AccessibilitySettings {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReaderMode: boolean;
    keyboardNavigation: boolean;
    soundEffects: boolean;
    focusIndicators: boolean;
    fontSize: number;
    announcements: boolean;
}

interface AccessibilityHelperProps {
    onSettingsChange?: (settings: AccessibilitySettings) => void;
    onAnnouncement?: (message: string) => void;
    compact?: boolean;
}

export const AccessibilityHelper: React.FC<AccessibilityHelperProps> = ({
    onSettingsChange,
    onAnnouncement,
    compact = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<AccessibilitySettings>({
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReaderMode: false,
        keyboardNavigation: true,
        soundEffects: false,
        focusIndicators: true,
        fontSize: 14,
        announcements: true
    });
    const [announcements, setAnnouncements] = useState<string[]>([]);

    // Загрузка настроек из localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('accessibility-settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
            applySettings(parsed);
        }
    }, []);

    // Применение настроек к DOM
    const applySettings = useCallback((newSettings: AccessibilitySettings) => {
        const root = document.documentElement;
        
        // Высокий контраст
        if (newSettings.highContrast) {
            root.setAttribute('data-high-contrast', 'true');
        } else {
            root.removeAttribute('data-high-contrast');
        }
        
        // Крупный текст
        if (newSettings.largeText) {
            root.style.fontSize = `${newSettings.fontSize + 4}px`;
        } else {
            root.style.fontSize = `${newSettings.fontSize}px`;
        }
        
        // Уменьшенная анимация
        if (newSettings.reducedMotion) {
            root.setAttribute('data-reduced-motion', 'true');
        } else {
            root.removeAttribute('data-reduced-motion');
        }
        
        // Индикаторы фокуса
        if (newSettings.focusIndicators) {
            root.setAttribute('data-focus-indicators', 'true');
        } else {
            root.removeAttribute('data-focus-indicators');
        }
        
        // Навигация с клавиатуры
        if (newSettings.keyboardNavigation) {
            root.setAttribute('data-keyboard-nav', 'true');
        } else {
            root.removeAttribute('data-keyboard-nav');
        }
    }, []);

    // Обновление настроек
    const updateSetting = (key: keyof AccessibilitySettings, value: boolean | number) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        applySettings(newSettings);
        localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
        onSettingsChange?.(newSettings);
        
        // Объявление для скринридеров
        if (settings.announcements) {
            announce(`${key} ${value ? 'включено' : 'отключено'}`);
        }
    };

    // Система объявлений для скринридеров
    const announce = (message: string) => {
        setAnnouncements(prev => [...prev, message]);
        if (onAnnouncement) {
            onAnnouncement(message);
        }
        setTimeout(() => {
            setAnnouncements(prev => prev.slice(1));
        }, 3000);
    };

    // Обработка горячих клавиш доступности
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Alt + A - открыть панель доступности
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                setIsOpen(!isOpen);
                announce('Панель доступности ' + (isOpen ? 'закрыта' : 'открыта'));
            }
            
            // Alt + H - высокий контраст
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                updateSetting('highContrast', !settings.highContrast);
            }
            
            // Alt + T - крупный текст
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                updateSetting('largeText', !settings.largeText);
            }
            
            // Alt + M - уменьшенная анимация
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                updateSetting('reducedMotion', !settings.reducedMotion);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, settings]);

    // Компактная версия
    if (compact) {
        return (
            <motion.button
                className="accessibility-compact"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Настройки доступности"
                title="Настройки доступности (Alt + A)"
            >
                <Accessibility size={16} />
                {(settings.highContrast || settings.largeText || settings.reducedMotion) && (
                    <div className="accessibility-indicator" />
                )}
                
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className="accessibility-popup"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="accessibility-quick-actions">
                                <button
                                    className={`quick-action ${settings.highContrast ? 'active' : ''}`}
                                    onClick={() => updateSetting('highContrast', !settings.highContrast)}
                                    aria-label="Высокий контраст"
                                >
                                    <Contrast size={14} />
                                </button>
                                <button
                                    className={`quick-action ${settings.largeText ? 'active' : ''}`}
                                    onClick={() => updateSetting('largeText', !settings.largeText)}
                                    aria-label="Крупный текст"
                                >
                                    <Type size={14} />
                                </button>
                                <button
                                    className={`quick-action ${settings.reducedMotion ? 'active' : ''}`}
                                    onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                                    aria-label="Уменьшенная анимация"
                                >
                                    <ZoomIn size={14} />
                                </button>
                                <button
                                    className={`quick-action ${settings.keyboardNavigation ? 'active' : ''}`}
                                    onClick={() => updateSetting('keyboardNavigation', !settings.keyboardNavigation)}
                                    aria-label="Навигация с клавиатуры"
                                >
                                    <Keyboard size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    }

    return (
        <>
            <motion.button
                className="accessibility-trigger"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Открыть настройки доступности"
                title="Настройки доступности (Alt + A)"
            >
                <Accessibility size={18} />
                <span>Доступность</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="accessibility-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="accessibility-panel"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="accessibility-header">
                                <div className="header-content">
                                    <Accessibility size={24} />
                                    <h2>Настройки доступности</h2>
                                </div>
                                <button
                                    className="close-btn"
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Закрыть"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="accessibility-content">
                                <div className="setting-group">
                                    <h3>Визуальные настройки</h3>
                                    
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <Contrast size={18} />
                                            <div>
                                                <label>Высокий контраст</label>
                                                <span>Увеличивает контрастность интерфейса</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.highContrast}
                                            onChange={(e) => updateSetting('highContrast', e.target.checked)}
                                            aria-label="Включить высокий контраст"
                                        />
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <Type size={18} />
                                            <div>
                                                <label>Крупный текст</label>
                                                <span>Увеличивает размер текста</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.largeText}
                                            onChange={(e) => updateSetting('largeText', e.target.checked)}
                                            aria-label="Включить крупный текст"
                                        />
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <Eye size={18} />
                                            <div>
                                                <label>Индикаторы фокуса</label>
                                                <span>Выделение активных элементов</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.focusIndicators}
                                            onChange={(e) => updateSetting('focusIndicators', e.target.checked)}
                                            aria-label="Включить индикаторы фокуса"
                                        />
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <h3>Навигация</h3>
                                    
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <Keyboard size={18} />
                                            <div>
                                                <label>Навигация с клавиатуры</label>
                                                <span>Полная поддержка клавиатуры</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.keyboardNavigation}
                                            onChange={(e) => updateSetting('keyboardNavigation', e.target.checked)}
                                            aria-label="Включить навигацию с клавиатуры"
                                        />
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <ZoomIn size={18} />
                                            <div>
                                                <label>Уменьшенная анимация</label>
                                                <span>Отключает анимации и переходы</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.reducedMotion}
                                            onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                                            aria-label="Включить уменьшенную анимацию"
                                        />
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <h3>Звуковые сигналы</h3>
                                    
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            {settings.soundEffects ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                            <div>
                                                <label>Звуковые эффекты</label>
                                                <span>Звуки при взаимодействии</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.soundEffects}
                                            onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                                            aria-label="Включить звуковые эффекты"
                                        />
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <MousePointer size={18} />
                                            <div>
                                                <label>Голосовые объявления</label>
                                                <span>Озвучивание действий</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.announcements}
                                            onChange={(e) => updateSetting('announcements', e.target.checked)}
                                            aria-label="Включить голосовые объявления"
                                        />
                                    </div>
                                </div>

                                <div className="setting-group">
                                    <h3>Размер шрифта</h3>
                                    <div className="font-size-control">
                                        <input
                                            type="range"
                                            min="12"
                                            max="24"
                                            value={settings.fontSize}
                                            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                                            aria-label="Размер шрифта"
                                        />
                                        <span>{settings.fontSize}px</span>
                                    </div>
                                </div>
                            </div>

                            <div className="accessibility-footer">
                                <div className="keyboard-shortcuts">
                                    <h4>Горячие клавиши:</h4>
                                    <div className="shortcuts">
                                        <span><kbd>Alt</kbd> + <kbd>A</kbd> - Открыть панель</span>
                                        <span><kbd>Alt</kbd> + <kbd>H</kbd> - Высокий контраст</span>
                                        <span><kbd>Alt</kbd> + <kbd>T</kbd> - Крупный текст</span>
                                        <span><kbd>Alt</kbd> + <kbd>M</kbd> - Уменьшенная анимация</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Скрытые объявления для скринридеров */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announcements.map((announcement, index) => (
                    <div key={index}>{announcement}</div>
                ))}
            </div>
        </>
    );
};

export default AccessibilityHelper;
