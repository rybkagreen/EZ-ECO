import React, { useState, useEffect } from 'react';
import { WebSocketService } from '../../services/WebSocketService';

interface ConnectionStatusProps {
    className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
    const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
    const [lastMessage, setLastMessage] = useState<string>('');

    useEffect(() => {
        const ws = WebSocketService.getInstance();
        
        // Подписка на изменения состояния соединения
        const handleConnectionChange = (data: any) => {
            console.log('Connection status changed:', data);
            setConnectionState(ws.getConnectionState());
            
            if (data.status === 'connected') {
                setLastMessage('✅ Соединение установлено');
            } else if (data.status === 'disconnected') {
                setLastMessage('❌ Соединение разорвано');
            } else if (data.status === 'error') {
                setLastMessage('⚠️ Ошибка соединения');
            } else if (data.status === 'max_retries_exceeded') {
                setLastMessage('🔄 Превышено максимальное количество попыток переподключения');
            }
        };

        ws.subscribe('connection', handleConnectionChange);

        // Инициализация состояния
        setConnectionState(ws.getConnectionState());

        return () => {
            ws.unsubscribe('connection', handleConnectionChange);
        };
    }, []);

    const getStatusColor = () => {
        switch (connectionState) {
            case 'OPEN': return 'text-green-500';
            case 'CONNECTING': return 'text-yellow-500';
            case 'CLOSING': return 'text-orange-500';
            case 'CLOSED':
            case 'DISCONNECTED':
            default: return 'text-red-500';
        }
    };

    const getStatusIcon = () => {
        switch (connectionState) {
            case 'OPEN': return '🟢';
            case 'CONNECTING': return '🟡';
            case 'CLOSING': return '🟠';
            case 'CLOSED':
            case 'DISCONNECTED':
            default: return '🔴';
        }
    };

    const getStatusText = () => {
        switch (connectionState) {
            case 'OPEN': return 'Подключен';
            case 'CONNECTING': return 'Подключается...';
            case 'CLOSING': return 'Отключается...';
            case 'CLOSED': return 'Отключен';
            case 'DISCONNECTED': return 'Не подключен';
            default: return 'Неизвестно';
        }
    };

    const handleReconnect = () => {
        const ws = WebSocketService.getInstance();
        // Для переподключения нужно создать новый экземпляр
        ws.disconnect();
        setLastMessage('🔄 Попытка переподключения...');
        // Новое соединение будет создано автоматически при следующем запросе
        setTimeout(() => {
            WebSocketService.getInstance();
        }, 1000);
    };

    return (
        <div className={`connection-status bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon()}</span>
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
                
                {(connectionState === 'CLOSED' || connectionState === 'DISCONNECTED') && (
                    <button
                        onClick={handleReconnect}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="Переподключиться"
                    >
                        🔄
                    </button>
                )}
            </div>
            
            {lastMessage && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {lastMessage}
                </div>
            )}
            
            {/* Детали для отладки */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500 font-mono">
                    WebSocket: ws://localhost:8001/ws/filemanager/
                </div>
            )}
        </div>
    );
};
