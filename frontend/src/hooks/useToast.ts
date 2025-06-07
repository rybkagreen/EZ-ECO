import { useState, useCallback } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((
        message: string, 
        type: Toast['type'] = 'info', 
        duration: number = 3000
    ) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type, duration };
        
        setToasts(prev => [...prev, newToast]);
        
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message: string, duration?: number) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
};
