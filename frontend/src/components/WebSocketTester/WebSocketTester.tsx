import React, { useState, useEffect } from 'react';
import { WebSocketService } from '../../services/WebSocketService';
import './WebSocketTester.css';

interface WebSocketMessage {
    type: string;
    data?: any;
    timestamp: string;
}

export const WebSocketTester: React.FC = () => {
    const [messages, setMessages] = useState<WebSocketMessage[]>([]);
    const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
    const [customMessage, setCustomMessage] = useState('');
    const wsService = WebSocketService.getInstance();

    useEffect(() => {
        // Подписываемся на все типы сообщений
        const handleMessage = (data: any, type: string) => {
            const newMessage: WebSocketMessage = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [newMessage, ...prev].slice(0, 50)); // Ограничиваем до 50 сообщений
        };

        const handleConnection = (data: any) => {
            setConnectionStatus(data.status?.toUpperCase() || 'UNKNOWN');
            handleMessage(data, 'connection');
        };

        // Подписываемся на все возможные события
        wsService.subscribe('connection', handleConnection);
        wsService.subscribe('connection_status', (data) => handleMessage(data, 'connection_status'));
        wsService.subscribe('pong', (data) => handleMessage(data, 'pong'));
        wsService.subscribe('files_list', (data) => handleMessage(data, 'files_list'));
        wsService.subscribe('project_info', (data) => handleMessage(data, 'project_info'));
        wsService.subscribe('error', (data) => handleMessage(data, 'error'));
        wsService.subscribe('heartbeat', (data) => handleMessage(data, 'heartbeat'));

        // Устанавливаем начальное состояние
        setConnectionStatus(wsService.getConnectionState());

        return () => {
            // Отписываемся от событий
            wsService.unsubscribe('connection', handleConnection);
            wsService.unsubscribe('connection_status');
            wsService.unsubscribe('pong');
            wsService.unsubscribe('files_list');
            wsService.unsubscribe('project_info');
            wsService.unsubscribe('error');
            wsService.unsubscribe('heartbeat');
        };
    }, [wsService]);

    const clearMessages = () => {
        setMessages([]);
    };

    const sendCustomMessage = () => {
        if (customMessage.trim()) {
            try {
                const messageData = JSON.parse(customMessage);
                wsService.sendMessage(messageData.action || 'custom', messageData);
                setCustomMessage('');
            } catch (error) {
                // Если это не JSON, отправляем как простое сообщение
                wsService.sendMessage('custom', { message: customMessage });
                setCustomMessage('');
            }
        }
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'OPEN': return '#22c55e';
            case 'CONNECTING': return '#f59e0b';
            case 'CLOSING': return '#ef4444';
            case 'CLOSED': 
            case 'DISCONNECTED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="websocket-tester">
            <div className="tester-header">
                <h3>WebSocket Tester</h3>
                <div className="connection-status" style={{ color: getStatusColor() }}>
                    <span className="status-indicator" style={{ backgroundColor: getStatusColor() }}></span>
                    {connectionStatus}
                </div>
            </div>

            <div className="controls">
                <div className="control-row">
                    <button onClick={() => wsService.ping()}>🏓 Ping</button>
                    <button onClick={() => wsService.requestProjectInfo()}>ℹ️ Project Info</button>
                    <button onClick={() => wsService.requestFilesList()}>📋 Files List</button>
                    <button onClick={clearMessages}>🗑️ Clear</button>
                </div>
                
                <div className="custom-message">
                    <input
                        type="text"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder='{"action": "custom", "data": "test"}'
                        onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
                    />
                    <button onClick={sendCustomMessage}>Send</button>
                </div>
            </div>

            <div className="messages">
                <h4>Messages ({messages.length})</h4>
                <div className="messages-list">
                    {messages.map((message, index) => (
                        <div key={index} className={`message message-${message.type}`}>
                            <div className="message-header">
                                <span className="message-type">{message.type}</span>
                                <span className="message-time">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="message-content">
                                <pre>{JSON.stringify(message.data, null, 2)}</pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
