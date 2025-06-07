import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Calculator, 
  FileType, 
  Brain, 
  Download, 
  Upload,
  Eye,
  Edit3,
  Share2,
  Zap,
  BarChart3,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Lightbulb,
  Target,
  FileSearch,
  Mic,
  Send,
  RefreshCw,
  Settings
} from 'lucide-react';
import ModernButton from '../ModernButton';
import './OfficeDocumentViewer.css';

interface DocumentFile {
  id: string;
  name: string;
  type: 'excel' | 'word' | 'pdf';
  size: string;
  modified: string;
  path: string;
  aiAnalyzed?: boolean;
  summary?: string;
  insights?: {
    score: number;
    complexity: 'low' | 'medium' | 'high';
    keywords: string[];
    language: string;
    readability: number;
    recommendations: string[];
    dataQuality?: number; // For Excel
    trends?: string[]; // For Excel
    errors?: string[]; // For Word/PDF
    structure?: {
      pages?: number;
      sections?: number;
      tables?: number;
      images?: number;
    };
  };
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>;
}

interface AIAnalysisResult {
  status: 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

interface OfficeDocumentViewerProps {
  files: DocumentFile[];
  onFileSelect: (file: DocumentFile) => void;
  onUpload: (files: FileList) => void;
  onClose?: () => void;
}

export const OfficeDocumentViewer: React.FC<OfficeDocumentViewerProps> = ({
  files,
  onFileSelect,
  onUpload,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'insights' | 'chat'>('preview');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel':
        return <Calculator className="file-type-icon excel" />;
      case 'word':
        return <FileText className="file-type-icon word" />;
      case 'pdf':
        return <FileType className="file-type-icon pdf" />;
      default:
        return <FileText className="file-type-icon" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'excel':
        return '#217346';
      case 'word':
        return '#2b579a';
      case 'pdf':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onUpload(files);
    }
  };

  const handleAiAnalysis = async (file: DocumentFile) => {
    setProcessing(true);
    setAnalysisProgress(0);
    setAnalysisResult({ status: 'analyzing', progress: 0 });
    
    // Симуляция продвинутого анализа с прогрессом
    const steps = [
      { name: 'Загрузка документа', duration: 500 },
      { name: 'Извлечение текста', duration: 800 },
      { name: 'Анализ структуры', duration: 1000 },
      { name: 'ИИ обработка', duration: 1500 },
      { name: 'Генерация инсайтов', duration: 700 },
      { name: 'Финализация', duration: 400 }
    ];
    
    let totalProgress = 0;
    const stepIncrement = 100 / steps.length;
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      totalProgress += stepIncrement;
      setAnalysisProgress(Math.min(100, totalProgress));
    }
    
    // Обновление файла с результатами продвинутого анализа
    const insights = generateAdvancedInsights(file.type);
    file.aiAnalyzed = true;
    file.summary = getAiSummary(file.type);
    file.insights = insights;
    file.chatHistory = [];
    
    setProcessing(false);
    setAnalysisProgress(100);
    setAnalysisResult({ 
      status: 'completed', 
      progress: 100, 
      result: insights 
    });
    
    // Автоматически переключаемся на вкладку инсайтов
    setTimeout(() => setActiveTab('insights'), 500);
  };

  const generateAdvancedInsights = (type: string) => {
    const baseInsights = {
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      language: 'Russian',
      readability: Math.floor(Math.random() * 40) + 60, // 60-100
      keywords: ['общие', 'ключевые', 'слова'],
      complexity: 'medium' as const,
      recommendations: ['Базовые рекомендации']
    };

    switch (type) {
      case 'excel':
        return {
          ...baseInsights,
          complexity: 'high' as const,
          keywords: ['данные', 'анализ', 'отчет', 'статистика', 'бюджет'],
          dataQuality: 85,
          trends: [
            'Рост продаж на 15% в Q3',
            'Снижение затрат на маркетинг',
            'Увеличение конверсии на 8%'
          ],
          recommendations: [
            'Оптимизировать структуру данных',
            'Добавить автоматические вычисления',
            'Создать интерактивный дашборд'
          ],
          structure: {
            pages: 5,
            sections: 12,
            tables: 8,
            images: 3
          }
        };
      
      case 'word':
        return {
          ...baseInsights,
          complexity: 'medium' as const,
          keywords: ['проект', 'стратегия', 'развитие', 'планирование', 'цели'],
          errors: [
            'Обнаружены 3 грамматические ошибки',
            'Рекомендуется улучшить структуру заголовков',
            'Добавить больше переходных фраз'
          ],
          recommendations: [
            'Улучшить читаемость текста',
            'Добавить визуальные элементы',
            'Структурировать содержание'
          ],
          structure: {
            pages: 15,
            sections: 8,
            tables: 2,
            images: 5
          }
        };
      
      case 'pdf':
        return {
          ...baseInsights,
          complexity: 'low' as const,
          keywords: ['документ', 'информация', 'данные', 'описание', 'инструкция'],
          recommendations: [
            'Оптимизировать для поиска',
            'Добавить закладки',
            'Улучшить качество изображений'
          ],
          structure: {
            pages: 8,
            sections: 6,
            tables: 4,
            images: 12
          }
        };
      
      default:
        return baseInsights;
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedFile) return;

    const userMessage = {
      role: 'user' as const,
      message: chatMessage,
      timestamp: new Date()
    };

    // Добавляем сообщение пользователя
    if (!selectedFile.chatHistory) selectedFile.chatHistory = [];
    selectedFile.chatHistory.push(userMessage);
    
    setChatMessage('');
    
    // Симуляция ответа ИИ
    setTimeout(() => {
      const aiResponse = generateAIResponse(chatMessage, selectedFile.type);
      const assistantMessage = {
        role: 'assistant' as const,
        message: aiResponse,
        timestamp: new Date()
      };
      
      selectedFile.chatHistory!.push(assistantMessage);
      
      // Прокрутка чата вниз
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1000);
  };

  const generateAIResponse = (question: string, fileType: string): string => {
    const responses: Record<string, string[]> = {
      excel: [
        'На основе анализа данных в таблице, я вижу положительную динамику роста. Рекомендую создать сводную таблицу для лучшей визуализации.',
        'Данные показывают тренд роста на 15%. Предлагаю добавить прогнозирование на следующий квартал.',
        'В столбцах обнаружены некоторые пропуски данных. Рекомендую проверить источники информации.'
      ],
      word: [
        'Структура документа соответствует стандартам. Рекомендую добавить оглавление для улучшения навигации.',
        'Текст имеет хорошую читаемость. Предлагаю добавить больше визуальных элементов для лучшего восприятия.',
        'Документ содержит качественную информацию. Рекомендую проверить форматирование заголовков.'
      ],
      pdf: [
        'PDF-документ имеет хорошее качество. Рекомендую добавить закладки для удобной навигации.',
        'Текст извлечен успешно. Предлагаю оптимизировать размер файла без потери качества.',
        'Структура документа соответствует стандартам. Рекомендую добавить метаданные.'
      ]
    };
    
    const typeResponses = responses[fileType] || responses.word;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Здесь была бы интеграция с Web Speech API
    if (!isRecording) {
      setTimeout(() => {
        setChatMessage('Расскажи подробнее об анализе этого документа');
        setIsRecording(false);
      }, 2000);
    }
  };

  useEffect(() => {
    if (selectedFile?.chatHistory) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFile?.chatHistory]);

  const getAiSummary = (type: string): string => {
    switch (type) {
      case 'excel':
        return 'Таблица содержит 1,247 записей, 12 столбцов. Обнаружены тренды роста на 15%. Рекомендуется создать дашборд для визуализации данных и улучшения аналитики.';
      case 'word':
        return 'Документ содержит 15 страниц качественного текста. Стиль: деловой. Обнаружены 3 грамматические ошибки. Читаемость: хорошая. Рекомендуется добавить оглавление.';
      case 'pdf':
        return 'PDF-файл содержит 8 страниц, 12 изображений, 4 таблицы. Извлечен текст в формате RTF. Качество сканирования: отличное. Рекомендуется добавить закладки.';
      default:
        return 'Анализ завершен успешно. Документ готов для работы.';
    }
  };

  const aiFeatures = [
    {
      icon: <Brain className="feature-icon" />,
      title: 'Продвинутый анализ',
      description: 'Глубокий ИИ-анализ структуры, содержания и качества документа',
      action: 'Анализировать',
      category: 'analysis'
    },
    {
      icon: <BarChart3 className="feature-icon" />,
      title: 'Умные отчеты',
      description: 'Автоматическая генерация аналитических отчетов и визуализаций',
      action: 'Создать отчет',
      category: 'reporting'
    },
    {
      icon: <MessageSquare className="feature-icon" />,
      title: 'Интеллектуальный чат',
      description: 'Задавайте вопросы о содержимом и получайте детальные ответы',
      action: 'Открыть чат',
      category: 'chat'
    },
    {
      icon: <Sparkles className="feature-icon" />,
      title: 'Улучшение контента',
      description: 'ИИ-редактирование, коррекция и оптимизация текста',
      action: 'Улучшить',
      category: 'enhancement'
    },
    {
      icon: <TrendingUp className="feature-icon" />,
      title: 'Прогнозирование',
      description: 'Анализ трендов и построение прогнозов на основе данных',
      action: 'Прогноз',
      category: 'prediction'
    },
    {
      icon: <FileSearch className="feature-icon" />,
      title: 'Семантический поиск',
      description: 'Поиск по смыслу и контексту в документах',
      action: 'Найти',
      category: 'search'
    }
  ];

  return (
    <div className="office-document-viewer">
      <div className="viewer-header">
        <div className="header-info">
          <h2 className="viewer-title">
            <FileText className="title-icon" />
            Офисные документы
          </h2>
          <div className="ai-toggle">
            <ModernButton
              type={aiMode ? "primary" : "outline"}
              size="small"
              onClick={() => setAiMode(!aiMode)}
              pulseAnimation={!aiMode}
            >
              <Brain size={16} />
              {aiMode ? 'ИИ режим ВКЛ' : 'ИИ режим ВЫКЛ'}
            </ModernButton>
          </div>
        </div>
        
        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.docx,.doc,.pdf"
            multiple
            style={{ display: 'none' }}
          />
          <ModernButton
            type="outline"
            size="medium"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Загрузить документы
          </ModernButton>
          {onClose && (
            <ModernButton
              type="outline"
              size="medium"
              onClick={onClose}
            >
              <X size={16} />
              Закрыть
            </ModernButton>
          )}
        </div>
      </div>

      <div className="viewer-content">
        <div className="files-sidebar">
          <div className="sidebar-header">
            <h3>Документы ({files.length})</h3>
          </div>
          
          <div className="files-list">
            {files.map(file => (
              <div 
                key={file.id}
                className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedFile(file);
                  onFileSelect(file);
                }}
              >
                <div className="file-info">
                  {getFileIcon(file.type)}
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.size} • {file.modified}
                    </div>
                  </div>
                </div>
                
                <div className="file-status">
                  {file.aiAnalyzed && (
                    <div className="ai-badge" title="Проанализировано ИИ">
                      <Brain size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="document-preview">
          {selectedFile ? (
            <div className="preview-container">
              <div className="preview-header">
                <div className="file-title">
                  {getFileIcon(selectedFile.type)}
                  <span>{selectedFile.name}</span>
                  {selectedFile.aiAnalyzed && (
                    <div className="ai-badge">
                      <Brain size={12} />
                      ИИ анализ
                    </div>
                  )}
                </div>
                
                <div className="preview-actions">
                  <ModernButton type="outline" size="small">
                    <Eye size={16} />
                    Просмотр
                  </ModernButton>
                  <ModernButton type="outline" size="small">
                    <Edit3 size={16} />
                    Редактировать
                  </ModernButton>
                  <ModernButton type="outline" size="small">
                    <Share2 size={16} />
                    Поделиться
                  </ModernButton>
                  <ModernButton type="outline" size="small">
                    <Download size={16} />
                    Скачать
                  </ModernButton>
                </div>
              </div>

              {/* Вкладки */}
              <div className="preview-tabs">
                <button 
                  className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye size={16} />
                  Предварительный просмотр
                </button>
                {selectedFile.aiAnalyzed && (
                  <button 
                    className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                  >
                    <BarChart3 size={16} />
                    ИИ Инсайты
                  </button>
                )}
                <button 
                  className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={16} />
                  Чат {selectedFile.chatHistory?.length ? `(${selectedFile.chatHistory.length})` : ''}
                </button>
              </div>

              <div className="preview-content">
                {activeTab === 'preview' && (
                  <div className="document-placeholder">
                    <div className="placeholder-icon" style={{ color: getFileColor(selectedFile.type) }}>
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <h3>Предварительный просмотр</h3>
                    <p>Документ: {selectedFile.name}</p>
                    <p>Размер: {selectedFile.size}</p>
                    <p>Тип: {selectedFile.type.toUpperCase()}</p>
                    
                    {processing && (
                      <div className="analysis-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${analysisProgress}%` }}
                          />
                        </div>
                        <p>Анализ документа... {Math.round(analysisProgress)}%</p>
                      </div>
                    )}

                    {selectedFile.aiAnalyzed && selectedFile.summary && (
                      <div className="ai-summary">
                        <h4>
                          <Sparkles className="summary-icon" />
                          ИИ Анализ
                        </h4>
                        <p>{selectedFile.summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'insights' && selectedFile.insights && (
                  <div className="insights-panel">
                    <div className="insights-header">
                      <h3>
                        <Brain className="insights-icon" />
                        Детальная аналитика
                      </h3>
                      <div className="insights-score">
                        <span className="score-label">Оценка качества:</span>
                        <span className={`score-value ${selectedFile.insights.score >= 80 ? 'excellent' : 
                          selectedFile.insights.score >= 60 ? 'good' : 'needs-improvement'}`}>
                          {selectedFile.insights.score}/100
                        </span>
                      </div>
                    </div>

                    <div className="insights-grid">
                      <div className="insight-card">
                        <div className="card-header">
                          <Target className="card-icon" />
                          <h4>Основные метрики</h4>
                        </div>
                        <div className="metrics-list">
                          <div className="metric">
                            <span>Сложность:</span>
                            <span className={`complexity-badge ${selectedFile.insights.complexity}`}>
                              {selectedFile.insights.complexity === 'low' ? 'Низкая' : 
                               selectedFile.insights.complexity === 'medium' ? 'Средняя' : 'Высокая'}
                            </span>
                          </div>
                          <div className="metric">
                            <span>Читаемость:</span>
                            <span>{selectedFile.insights.readability}%</span>
                          </div>
                          <div className="metric">
                            <span>Язык:</span>
                            <span>{selectedFile.insights.language}</span>
                          </div>
                          {selectedFile.insights.dataQuality && (
                            <div className="metric">
                              <span>Качество данных:</span>
                              <span>{selectedFile.insights.dataQuality}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="insight-card">
                        <div className="card-header">
                          <Search className="card-icon" />
                          <h4>Ключевые слова</h4>
                        </div>
                        <div className="keywords-list">
                          {selectedFile.insights.keywords.map((keyword, index) => (
                            <span key={index} className="keyword-tag">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedFile.insights.structure && (
                        <div className="insight-card">
                          <div className="card-header">
                            <FileText className="card-icon" />
                            <h4>Структура документа</h4>
                          </div>
                          <div className="structure-info">
                            {selectedFile.insights.structure.pages && (
                              <div className="structure-item">
                                <span>Страниц: {selectedFile.insights.structure.pages}</span>
                              </div>
                            )}
                            {selectedFile.insights.structure.sections && (
                              <div className="structure-item">
                                <span>Разделов: {selectedFile.insights.structure.sections}</span>
                              </div>
                            )}
                            {selectedFile.insights.structure.tables && (
                              <div className="structure-item">
                                <span>Таблиц: {selectedFile.insights.structure.tables}</span>
                              </div>
                            )}
                            {selectedFile.insights.structure.images && (
                              <div className="structure-item">
                                <span>Изображений: {selectedFile.insights.structure.images}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="insight-card recommendations-card">
                        <div className="card-header">
                          <Lightbulb className="card-icon" />
                          <h4>Рекомендации ИИ</h4>
                        </div>
                        <div className="recommendations-list">
                          {selectedFile.insights.recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-item">
                              <CheckCircle className="rec-icon" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedFile.insights.trends && (
                        <div className="insight-card">
                          <div className="card-header">
                            <TrendingUp className="card-icon" />
                            <h4>Выявленные тренды</h4>
                          </div>
                          <div className="trends-list">
                            {selectedFile.insights.trends.map((trend, index) => (
                              <div key={index} className="trend-item">
                                <span>{trend}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedFile.insights.errors && (
                        <div className="insight-card errors-card">
                          <div className="card-header">
                            <AlertTriangle className="card-icon" />
                            <h4>Обнаруженные проблемы</h4>
                          </div>
                          <div className="errors-list">
                            {selectedFile.insights.errors.map((error, index) => (
                              <div key={index} className="error-item">
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="chat-panel">
                    <div className="chat-messages">
                      {selectedFile.chatHistory && selectedFile.chatHistory.length > 0 ? (
                        selectedFile.chatHistory.map((msg, index) => (
                          <div key={index} className={`chat-message ${msg.role}`}>
                            <div className="message-avatar">
                              {msg.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                              <div className="message-text">{msg.message}</div>
                              <div className="message-time">
                                {msg.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="chat-empty">
                          <MessageSquare className="chat-empty-icon" />
                          <h4>Начните общение с документом</h4>
                          <p>Задайте вопрос о содержимом, структуре или анализе документа</p>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="chat-input">
                      <input
                        type="text"
                        placeholder="Задайте вопрос о документе..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="chat-text-input"
                      />
                      <ModernButton
                        type="outline"
                        size="small"
                        onClick={handleVoiceInput}
                        className={isRecording ? 'recording' : ''}
                      >
                        <Mic size={16} />
                      </ModernButton>
                      <ModernButton
                        type="primary"
                        size="small"
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                      >
                        <Send size={16} />
                      </ModernButton>
                    </div>
                  </div>
                )}
              </div>

              {aiMode && activeTab === 'preview' && (
                <div className="ai-features-panel">
                  <div className="features-header">
                    <h4>
                      <Zap className="features-icon" />
                      ИИ Возможности
                    </h4>
                    <ModernButton type="outline" size="small">
                      <Settings size={14} />
                      Настройки
                    </ModernButton>
                  </div>
                  <div className="ai-features-grid">
                    {aiFeatures.map((feature, index) => (
                      <div key={index} className="ai-feature-card">
                        <div className="feature-icon-wrapper">
                          {feature.icon}
                        </div>
                        <div className="feature-content">
                          <h5>{feature.title}</h5>
                          <p>{feature.description}</p>
                        </div>
                        <ModernButton
                          type={feature.category === 'analysis' && !selectedFile.aiAnalyzed ? "primary" : "outline"}
                          size="small"
                          onClick={() => {
                            if (feature.category === 'analysis' && !selectedFile.aiAnalyzed) {
                              handleAiAnalysis(selectedFile);
                            } else if (feature.category === 'chat') {
                              setActiveTab('chat');
                            } else if (feature.category === 'analysis' && selectedFile.aiAnalyzed) {
                              setActiveTab('insights');
                            }
                          }}
                          disabled={processing}
                        >
                          {processing && feature.category === 'analysis' ? (
                            <RefreshCw className="processing-icon" />
                          ) : null}
                          {feature.action}
                        </ModernButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <FileText className="no-selection-icon" />
              <h3>Выберите документ</h3>
              <p>Выберите файл из списка для просмотра и работы с ним</p>
              <div className="quick-upload">
                <ModernButton
                  type="primary"
                  size="medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  Загрузить первый документ
                </ModernButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficeDocumentViewer;
