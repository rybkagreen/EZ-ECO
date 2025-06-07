import { useEffect, useCallback } from 'react';

export interface HotKey {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    action: () => void;
    description?: string;
}

interface UseHotKeysOptions {
    enabled?: boolean;
    preventDefault?: boolean;
}

export const useHotKeys = (
    hotKeys: HotKey[], 
    options: UseHotKeysOptions = {}
) => {
    const { enabled = true, preventDefault = true } = options;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const matchingHotKey = hotKeys.find(hotKey => {
            const keyMatch = hotKey.key.toLowerCase() === event.key.toLowerCase();
            const ctrlMatch = !!hotKey.ctrl === event.ctrlKey;
            const altMatch = !!hotKey.alt === event.altKey;
            const shiftMatch = !!hotKey.shift === event.shiftKey;
            const metaMatch = !!hotKey.meta === event.metaKey;

            return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
        });

        if (matchingHotKey) {
            if (preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            }
            matchingHotKey.action();
        }
    }, [hotKeys, enabled, preventDefault]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const formatHotKeyText = useCallback((hotKey: HotKey) => {
        const parts: string[] = [];
        
        if (hotKey.ctrl) parts.push('Ctrl');
        if (hotKey.alt) parts.push('Alt');
        if (hotKey.shift) parts.push('Shift');
        if (hotKey.meta) parts.push('Cmd');
        
        parts.push(hotKey.key.toUpperCase());
        
        return parts.join(' + ');
    }, []);

    return { formatHotKeyText };
};
