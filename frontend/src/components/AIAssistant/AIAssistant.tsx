import React, { useState, useEffect } from 'react';
import { 
    Bot, 
    Brain, 
    FileText, 
    Search, 
    Send, 
    Loader, 
    CheckCircle, 
    XCircle,
    History,
    Settings
} from 'lucide-react';
import './AIAssistant.css';

interface OllamaStatus {
    connected: boolean;
    available_models: Array<{name: string; size: number; modified_at: string}>;
    default_model: string;
    base_url: string;
}

interface AnalysisResult {
    analysis_id: string;
    result: any;
    status: string;
    file_name?: string;
}

interface AnalysisHistory {
    id: string;
    analysis_type: string;
    status: string;
    created_at: string;
    file_name?: string;
    model_name: string;
}

interface AIAssistantProps {
    onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
    const [status, setStatus] = useState<OllamaStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'search' | 'history'>('chat');
    
    // Chat state
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
    
    // Analysis state
    const [analysisText, setAnalysisText] = useState('');
    const [analysisType, setAnalysisType] = useState<'general' | 'code' | 'document'>('general');
    const [language, setLanguage] = useState('python');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchContext, setSearchContext] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    
    // History state
    const [history, setHistory] = useState<AnalysisHistory[]>([]);
    
    // Selected model
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        checkOllamaStatus();
        loadHistory();
    }, []);

    const checkOllamaStatus = async () => {
        try {
            const response = await fetch('/api/v1/ai/ollama/status/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
                if (data.available_models.length > 0 && !selectedModel) {
                    setSelectedModel(data.default_model);
                }
            }
        } catch (error) {
            console.error('Failed to check Ollama status:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await fetch('/api/v1/ai/history/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setHistory(data.analyses);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const sendChatMessage = async () => {
        if (!prompt.trim()) return;
        
        setLoading(true);
        const userMessage = prompt;
        setPrompt('');
        
        // Add user message to history
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        
        try {
            const response = await fetch('/api/v1/ai/generate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    prompt: userMessage,
                    model: selectedModel
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    content: data.response 
                }]);
            } else {
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Извините, произошла ошибка при обработке запроса.' 
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [...prev, { 
                role: 'assistant', 
                content: 'Ошибка подключения к серверу.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const analyzeText = async () => {
        if (!analysisText.trim()) return;
        
        setLoading(true);
        setAnalysisResult(null);
        
        try {
            const response = await fetch('/api/v1/ai/analyze/text/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    text: analysisText,
                    analysis_type: analysisType,
                    language: analysisType === 'code' ? language : undefined,
                    model: selectedModel
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setAnalysisResult(data);
                loadHistory(); // Refresh history
            }
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setSearchResult(null);
        
        try {
            const response = await fetch('/api/v1/ai/search/smart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({
                    query: searchQuery,
                    context: searchContext
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setSearchResult(data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStatusIndicator = () => {
        if (!status) {
            return <div className="status-indicator loading">Проверка соединения...</div>;
        }
        
        return (
            <div className={`status-indicator ${status.connected ? 'connected' : 'disconnected'}`}>
                {status.connected ? (
                    <>
                        <CheckCircle size={16} />
                        <span>Ollama подключен ({status.available_models.length} моделей)</span>
                    </>
                ) : (
                    <>
                        <XCircle size={16} />
                        <span>Ollama недоступен</span>
                    </>
                )}
            </div>
        );
    };

    const renderChat = () => (
        <div className="ai-chat">
            <div className="chat-messages">
                {chatHistory.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        <div className="message-content">
                            {message.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-content">
                            <Loader className="spinning" size={16} />
                            Генерирую ответ...
                        </div>
                    </div>
                )}
            </div>
            
            <div className="chat-input">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Задайте вопрос ИИ..."
                    onKeyDown={(e) => e.key === 'Enter' && !loading && sendChatMessage()}
                    disabled={!status?.connected || loading}
                />
                <button 
                    onClick={sendChatMessage}
                    disabled={!status?.connected || loading || !prompt.trim()}
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );

    const renderAnalysis = () => (
        <div className="ai-analysis">
            <div className="analysis-controls">
                <select 
                    value={analysisType} 
                    onChange={(e) => setAnalysisType(e.target.value as any)}
                >
                    <option value="general">Общий анализ</option>
                    <option value="code">Анализ кода</option>
                    <option value="document">Анализ документа</option>
                </select>
                
                {analysisType === 'code' && (
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                )}
            </div>
            
            <textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                placeholder="Вставьте текст для анализа..."
                rows={10}
                disabled={!status?.connected}
            />
            
            <button 
                onClick={analyzeText}
                disabled={!status?.connected || loading || !analysisText.trim()}
                className="analyze-button"
            >
                {loading ? <Loader className="spinning" size={16} /> : <Brain size={16} />}
                Анализировать
            </button>
            
            {analysisResult && (
                <div className="analysis-results">
                    <h3>Результаты анализа</h3>
                    <pre>{JSON.stringify(analysisResult.result, null, 2)}</pre>
                </div>
            )}
        </div>
    );

    const renderSearch = () => (
        <div className="ai-search">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поисковый запрос..."
                disabled={!status?.connected}
            />
            
            <textarea
                value={searchContext}
                onChange={(e) => setSearchContext(e.target.value)}
                placeholder="Контекст для поиска (опционально)..."
                rows={6}
                disabled={!status?.connected}
            />
            
            <button 
                onClick={performSearch}
                disabled={!status?.connected || loading || !searchQuery.trim()}
                className="search-button"
            >
                {loading ? <Loader className="spinning" size={16} /> : <Search size={16} />}
                Поиск
            </button>
            
            {searchResult && (
                <div className="search-results">
                    <h3>Результаты поиска</h3>
                    <div className="search-result-content">
                        {searchResult.result.relevance_explanation}
                    </div>
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="ai-history">
            <div className="history-header">
                <h3>История анализов</h3>
                <button onClick={loadHistory} className="refresh-button">
                    Обновить
                </button>
            </div>
            
            <div className="history-list">
                {history.map((item) => (
                    <div key={item.id} className="history-item">
                        <div className="history-item-header">
                            <span className="history-type">{item.analysis_type}</span>
                            <span className={`history-status ${item.status}`}>{item.status}</span>
                        </div>
                        <div className="history-item-details">
                            {item.file_name && <span>Файл: {item.file_name}</span>}
                            <span>Модель: {item.model_name}</span>
                            <span>Создан: {new Date(item.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="ai-assistant">
            <div className="ai-header">
                <div className="ai-title">
                    <Bot size={24} />
                    <h2>ИИ Ассистент</h2>
                </div>
                
                {renderStatusIndicator()}
                
                {status?.connected && (
                    <div className="model-selector">
                        <Settings size={16} />
                        <select 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            {status.available_models.map((model) => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                {onClose && (
                    <button className="close-button" onClick={onClose} title="Закрыть">
                        ✕
                    </button>
                )}
            </div>
            
            <div className="ai-tabs">
                <button 
                    className={activeTab === 'chat' ? 'active' : ''}
                    onClick={() => setActiveTab('chat')}
                >
                    <Bot size={16} />
                    Чат
                </button>
                <button 
                    className={activeTab === 'analysis' ? 'active' : ''}
                    onClick={() => setActiveTab('analysis')}
                >
                    <FileText size={16} />
                    Анализ
                </button>
                <button 
                    className={activeTab === 'search' ? 'active' : ''}
                    onClick={() => setActiveTab('search')}
                >
                    <Search size={16} />
                    Поиск
                </button>
                <button 
                    className={activeTab === 'history' ? 'active' : ''}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={16} />
                    История
                </button>
            </div>
            
            <div className="ai-content">
                {activeTab === 'chat' && renderChat()}
                {activeTab === 'analysis' && renderAnalysis()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'history' && renderHistory()}
            </div>
        </div>
    );
};

export default AIAssistant;
