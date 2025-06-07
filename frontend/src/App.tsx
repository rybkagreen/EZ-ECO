import React, { useState, Suspense, lazy } from 'react';
import { TerminalFileManager } from './components/TerminalFileManager/TerminalFileManager';
import { ChatWindow } from './components/ChatWindow/ChatWindow';
import AIAssistant from './components/AIAssistant/AIAssistant';
import StaticWelcome from './components/StaticWelcome/StaticWelcome';
import { LoginWelcomeScreen, ParticleLoginScreen, MatrixLoginScreen } from './components/LoginWelcomeScreen';
import Header from './components/Header';
import './styles/colors.css';
import './App.css';

// Lazy load компонентов для оптимизации
const ExtensionMarketplace = lazy(() => import('./components/ExtensionMarketplace'));
const OfficeDocumentViewer = lazy(() => import('./components/OfficeDocumentViewer'));
const AIIntegrationDemo = lazy(() => import('./components/AIIntegrationDemo'));
const CustomizationPanel = lazy(() => import('./components/CustomizationPanel'));

// Демо данные для офисных документов
const demoOfficeFiles = [
  {
    id: '1',
    name: 'Квартальный отчет Q3.xlsx',
    type: 'excel' as const,
    size: '2.4 MB',
    modified: '2 часа назад',
    path: '/documents/reports/',
    aiAnalyzed: true,
    summary: 'Таблица содержит 1,247 записей, 12 столбцов. Обнаружены тренды роста на 15%. Рекомендуется создать дашборд для визуализации данных.',
    insights: {
      score: 87,
      complexity: 'high' as const,
      keywords: ['продажи', 'выручка', 'рост', 'KPI', 'анализ'],
      language: 'Russian',
      readability: 85,
      dataQuality: 92,
      trends: [
        'Рост продаж на 15% в Q3',
        'Увеличение прибыли на 8%',
        'Снижение затрат на 3%'
      ],
      recommendations: [
        'Создать интерактивный дашборд',
        'Автоматизировать сбор данных',
        'Добавить прогнозные модели'
      ],
      structure: {
        pages: 5,
        sections: 8,
        tables: 12,
        images: 6
      }
    },
    chatHistory: [
      {
        role: 'user' as const,
        message: 'Какие основные тренды видны в отчете?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        role: 'assistant' as const,
        message: 'В отчете выявлены три ключевых тренда: рост продаж на 15%, увеличение прибыли на 8% и снижение операционных затрат на 3%. Это указывает на эффективную оптимизацию бизнес-процессов.',
        timestamp: new Date(Date.now() - 29 * 60 * 1000)
      }
    ]
  },
  {
    id: '2',
    name: 'Техническое задание.docx',
    type: 'word' as const,
    size: '856 KB',
    modified: '1 день назад',
    path: '/documents/specs/',
    aiAnalyzed: true,
    summary: 'Документ содержит 24 страницы технических требований. Стиль: техническая документация. Читаемость: хорошая. Рекомендуется добавить диаграммы.',
    insights: {
      score: 78,
      complexity: 'medium' as const,
      keywords: ['требования', 'система', 'функциональность', 'архитектура', 'API'],
      language: 'Russian',
      readability: 72,
      errors: [
        'Найдены 2 грамматические ошибки',
        'Рекомендуется унификация терминологии',
        'Добавить больше диаграмм для clarity'
      ],
      recommendations: [
        'Создать глоссарий терминов',
        'Добавить схемы архитектуры',
        'Структурировать требования по приоритетам'
      ],
      structure: {
        pages: 24,
        sections: 12,
        tables: 6,
        images: 3
      }
    }
  },
  {
    id: '3',
    name: 'Презентация проекта.pdf',
    type: 'pdf' as const,
    size: '12.3 MB',
    modified: '3 дня назад',
    path: '/documents/presentations/',
    aiAnalyzed: true,
    summary: 'PDF-файл содержит 24 страницы, 18 изображений, 4 диаграммы. Извлечен текст в формате RTF. Качество: отличное. Презентация готова к показу.',
    insights: {
      score: 91,
      complexity: 'low' as const,
      keywords: ['проект', 'цели', 'результаты', 'команда', 'план'],
      language: 'Russian',
      readability: 88,
      recommendations: [
        'Добавить интерактивные элементы',
        'Оптимизировать для веб-просмотра',
        'Создать версию для печати'
      ],
      structure: {
        pages: 24,
        sections: 6,
        tables: 3,
        images: 18
      }
    }
  },
  {
    id: '4',
    name: 'Финансовый анализ.xlsx',
    type: 'excel' as const,
    size: '3.8 MB',
    modified: '5 дней назад',
    path: '/documents/finance/',
    aiAnalyzed: false
  },
  {
    id: '5',
    name: 'Руководство пользователя.pdf',
    type: 'pdf' as const,
    size: '5.2 MB',
    modified: '1 неделю назад',
    path: '/documents/manuals/',
    aiAnalyzed: false
  }
];

function App() {
    const [showChat, setShowChat] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showExtensions, setShowExtensions] = useState(false);
    const [showOfficeViewer, setShowOfficeViewer] = useState(false);
    const [showAIDemo, setShowAIDemo] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginScreenType, setLoginScreenType] = useState<'static' | 'floating' | 'particle' | 'matrix'>('floating');

    // Обработчик авторизации
    const handleLogin = (username: string, password: string) => {
        console.log('Login attempt:', { username, password });
        setIsAuthenticated(true);
        setShowWelcome(false);
    };

    // Переключение типа приветственного экрана (для демонстрации)
    const switchLoginScreen = () => {
        const types: Array<'static' | 'floating' | 'particle' | 'matrix'> = ['static', 'floating', 'particle', 'matrix'];
        const currentIndex = types.indexOf(loginScreenType);
        const nextIndex = (currentIndex + 1) % types.length;
        setLoginScreenType(types[nextIndex]);
    };

    // Показ приветственного экрана до авторизации
    if (showWelcome && !isAuthenticated) {
        return (
            <div>
                {/* Кнопка переключения типа анимации (для демонстрации) */}
                <button 
                    onClick={switchLoginScreen}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '20px',
                        zIndex: 1001,
                        padding: '10px 15px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                    }}
                >
                    Тип: {loginScreenType}
                </button>

                {/* Различные типы приветственных экранов */}
                {loginScreenType === 'static' && (
                    <StaticWelcome onContinue={() => setIsAuthenticated(true)} />
                )}
                {loginScreenType === 'floating' && (
                    <LoginWelcomeScreen 
                        onLogin={handleLogin}
                        onContinue={() => setShowWelcome(false)}
                    />
                )}
                {loginScreenType === 'particle' && (
                    <ParticleLoginScreen 
                        onLogin={handleLogin}
                        onContinue={() => setShowWelcome(false)}
                    />
                )}
                {loginScreenType === 'matrix' && (
                    <MatrixLoginScreen 
                        onLogin={handleLogin}
                        onContinue={() => setShowWelcome(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="App terminal-app">
            <Header />
            <div className="app-content">
                <Suspense fallback={<div className="loading-spinner">Загрузка...</div>}>
                    <CustomizationPanel />
                </Suspense>
                <TerminalFileManager 
                    onToggleChat={() => setShowChat(!showChat)}
                    onToggleAI={() => setShowAI(!showAI)}
                    onShowExtensions={() => setShowExtensions(true)}
                    onShowOfficeViewer={() => setShowOfficeViewer(true)}
                    onShowAIDemo={() => setShowAIDemo(true)}
                />
                {showChat && <ChatWindow onClose={() => setShowChat(false)} />}
                {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
                {showExtensions && (
                    <Suspense fallback={<div className="loading-spinner">Загрузка маркетплейса...</div>}>
                        <ExtensionMarketplace onClose={() => setShowExtensions(false)} />
                    </Suspense>
                )}
                {showOfficeViewer && (
                    <Suspense fallback={<div className="loading-spinner">Загрузка просмотрщика документов...</div>}>
                        <OfficeDocumentViewer 
                            files={demoOfficeFiles}
                            onFileSelect={(file) => console.log('Selected file:', file)}
                            onUpload={(files) => console.log('Uploaded files:', files)}
                            onClose={() => setShowOfficeViewer(false)}
                        />
                    </Suspense>
                )}
                {showAIDemo && (
                    <Suspense fallback={<div className="loading-spinner">Загрузка ИИ демо...</div>}>
                        <AIIntegrationDemo 
                            onClose={() => setShowAIDemo(false)}
                        />
                    </Suspense>
                )}
            </div>
        </div>
    );
}

export default App;
