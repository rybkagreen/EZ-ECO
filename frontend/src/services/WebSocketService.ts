type MessageHandler = (data: any) => void;

export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp?: string;
}

export class WebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private subscribers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private wsUrl = 'ws://localhost:8001/ws/filemanager/';

    private constructor() {
        this.connect();
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    private connect() {
        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('WebSocket connection already in progress');
            return;
        }

        this.isConnecting = true;
        console.log('Connecting to WebSocket:', this.wsUrl);

        try {
            this.socket = new WebSocket(this.wsUrl);

            this.socket.onopen = (event) => {
                console.log('WebSocket connected successfully');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.notifySubscribers('connection', { status: 'connected' });
            };

            this.socket.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    this.notifySubscribers(message.type, message.data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnecting = false;
                this.socket = null;
                this.notifySubscribers('connection', { status: 'disconnected', code: event.code, reason: event.reason });
                
                if (!event.wasClean) {
                    this.attemptReconnect();
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
                this.notifySubscribers('connection', { status: 'error', error });
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.attemptReconnect();
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.notifySubscribers('connection', { status: 'max_retries_exceeded' });
        }
    }

    private notifySubscribers(type: string, data: any) {
        const handlers = this.subscribers.get(type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in WebSocket message handler:', error);
                }
            });
        }
    }

    public subscribe(type: string, handler: MessageHandler) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        this.subscribers.get(type)?.add(handler);

        // Если WebSocket не подключен, пытаемся подключиться
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            this.connect();
        }
    }

    public unsubscribe(type: string, handler?: MessageHandler) {
        if (handler) {
            this.subscribers.get(type)?.delete(handler);
        } else {
            this.subscribers.delete(type);
        }
    }

    public send(type: string, data: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const message: WebSocketMessage = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            this.socket.send(JSON.stringify(message));
            console.log('WebSocket message sent:', message);
        } else {
            console.error('WebSocket is not connected. Current state:', this.socket?.readyState);
        }
    }

    public getConnectionState(): string {
        if (!this.socket) return 'DISCONNECTED';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    }

    public sendMessage(type: string, data?: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = {
                action: type,
                ...data
            };
            this.socket.send(JSON.stringify(message));
            console.log('WebSocket message sent:', message);
        } else {
            console.warn('Cannot send message: WebSocket is not connected');
        }
    }

    public ping() {
        this.sendMessage('ping');
    }

    public requestFilesList(path?: string) {
        this.sendMessage('list_files', { path });
    }

    public requestProjectInfo() {
        this.sendMessage('get_project_info');
    }

    public startFileWatch(path?: string) {
        this.sendMessage('start_watch', { path });
    }

    public stopFileWatch() {
        this.sendMessage('stop_watch');
    }
}
