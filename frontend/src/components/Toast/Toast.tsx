import React, { useState, useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
    message, 
    type, 
    duration = 3000, 
    onClose 
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast--${type}`}>
            <div className="toast__content">
                <span className="toast__message">{message}</span>
                <button className="toast__close" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>
    );
};

export interface ToastManagerProps {
    toasts: Array<{
        id: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
    }>;
    onRemoveToast: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ 
    toasts, 
    onRemoveToast 
}) => {
    return (
        <div className="toast-manager">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onRemoveToast(toast.id)}
                />
            ))}
        </div>
    );
};
