import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import './ThemeToggle.css';

interface ThemeToggleProps {
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Проверяем сохраненную тему или системные настройки
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        setIsDarkMode(shouldUseDark);
        applyTheme(shouldUseDark);
    }, []);

    const applyTheme = (darkMode: boolean) => {
        const root = document.documentElement;
        
        if (darkMode) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }
    };

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        applyTheme(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    return (
        <button 
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            aria-label={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
            <div className="theme-toggle-icon">
                {isDarkMode ? (
                    <Sun size={16} className="icon-sun" />
                ) : (
                    <Moon size={16} className="icon-moon" />
                )}
            </div>
            <span className="theme-toggle-text">
                {isDarkMode ? 'Светлая' : 'Темная'}
            </span>
        </button>
    );
};

export default ThemeToggle;