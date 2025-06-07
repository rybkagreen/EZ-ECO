import React, { useState, useEffect } from 'react';
import './AIIntegrationDemo.css';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  MessageSquare,
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  Search,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import ModernButton from '../ModernButton';
import './AIIntegrationDemo.css';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  status: 'pending' | 'running' | 'completed';
}

export interface AIIntegrationDemoProps {
  onClose: () => void;
}

const AIIntegrationDemo: React.FC<AIIntegrationDemoProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const demoSteps: DemoStep[] = [
    {
      id: 'upload',
      title: 'Загрузка документа',
      description: 'ИИ автоматически определяет тип документа и готовится к анализу',
      icon: <FileText size={20} />,
      duration: 1000,
      status: 'pending'
    },
    {
      id: 'analyze',
      title: 'Структурный анализ',
      description: 'Анализ структуры документа, извлечение метаданных и содержимого',
      icon: <Search size={20} />,
      duration: 1500,
      status: 'pending'
    },
    {
      id: 'ai-process',
      title: 'ИИ обработка',
      description: 'Глубокий анализ содержимого с помощью языковых моделей',
      icon: <Brain size={20} />,
      duration: 2000,
      status: 'pending'
    },
    {
      id: 'insights',
      title: 'Генерация инсайтов',
      description: 'Создание умных рекомендаций и выявление ключевых моментов',
      icon: <Sparkles size={20} />,
      duration: 1200,
      status: 'pending'
    },
    {
      id: 'visualization',
      title: 'Визуализация данных',
      description: 'Построение графиков, чартов и интерактивных элементов',
      icon: <BarChart3 size={20} />,
      duration: 800,
      status: 'pending'
    },
    {
      id: 'chat-ready',
      title: 'Готовность к диалогу',
      description: 'Активация интеллектуального чата для вопросов о документе',
      icon: <MessageSquare size={20} />,
      duration: 600,
      status: 'pending'
    }
  ];

  const [steps, setSteps] = useState(demoSteps);

  const startDemo = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < steps.length; i++) {
      // Обновляем статус текущего шага
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'running' : index < i ? 'completed' : 'pending'
      })));
      
      setCurrentStep(i);

      // Симуляция выполнения шага
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));

      // Обновляем прогресс
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Завершаем все шаги
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
    setIsRunning(false);
  };

  const resetDemo = () => {
    setSteps(demoSteps);
    setCurrentStep(0);
    setProgress(0);
    setIsRunning(false);
  };

  return (
    <div className="ai-integration-demo">
      <div className="demo-header">
        <div className="demo-title">
          <Brain className="demo-icon" />
          <h2>Демонстрация ИИ интеграции</h2>
        </div>
        <div className="demo-actions">
          <ModernButton type="outline" size="small" onClick={onClose}>
            Закрыть
          </ModernButton>
        </div>
      </div>

      <div className="demo-content">
        <div className="demo-description">
          <h3>🚀 Как работает ИИ анализ документов</h3>
          <p>
            Наша система использует передовые алгоритмы машинного обучения для 
            автоматического анализа офисных документов. Посмотрите, как происходит 
            процесс от загрузки файла до получения умных рекомендаций.
          </p>
        </div>

        <div className="demo-progress">
          <div className="progress-header">
            <span>Прогресс обработки</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="demo-steps">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`demo-step ${step.status} ${currentStep === index ? 'current' : ''}`}
            >
              <div className="step-icon">
                {step.status === 'completed' ? (
                  <CheckCircle size={20} />
                ) : step.status === 'running' ? (
                  <div className="spinner" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
              <div className="step-status">
                {step.status === 'running' && (
                  <Clock className="status-icon running" />
                )}
                {step.status === 'completed' && (
                  <CheckCircle className="status-icon completed" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="demo-controls">
          {!isRunning ? (
            <ModernButton 
              type="primary" 
              size="large"
              onClick={startDemo}
              disabled={progress === 100}
            >
              <Zap size={16} />
              {progress === 100 ? 'Демонстрация завершена' : 'Начать демонстрацию'}
            </ModernButton>
          ) : (
            <ModernButton type="outline" size="large" disabled>
              <div className="spinner" />
              Выполняется анализ...
            </ModernButton>
          )}
          
          {progress > 0 && (
            <ModernButton 
              type="outline" 
              size="large"
              onClick={resetDemo}
              disabled={isRunning}
            >
              Сбросить демо
            </ModernButton>
          )}
        </div>

        {progress === 100 && (
          <div className="demo-results">
            <div className="results-header">
              <Target className="results-icon" />
              <h3>Результаты анализа</h3>
            </div>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-metric">
                  <span className="metric-value">87%</span>
                  <span className="metric-label">Качество документа</span>
                </div>
              </div>
              <div className="result-card">
                <div className="result-metric">
                  <span className="metric-value">12</span>
                  <span className="metric-label">Ключевых инсайтов</span>
                </div>
              </div>
              <div className="result-card">
                <div className="result-metric">
                  <span className="metric-value">3</span>
                  <span className="metric-label">Рекомендации ИИ</span>
                </div>
              </div>
              <div className="result-card">
                <div className="result-metric">
                  <span className="metric-value">Ready</span>
                  <span className="metric-label">Статус чата</span>
                </div>
              </div>
            </div>
            
            <div className="demo-features">
              <h4>✨ Доступные возможности:</h4>
              <div className="features-list">
                <div className="feature-item">
                  <MessageSquare className="feature-icon" />
                  <span>Интеллектуальный чат с документом</span>
                </div>
                <div className="feature-item">
                  <BarChart3 className="feature-icon" />
                  <span>Автоматическая генерация отчетов</span>
                </div>
                <div className="feature-item">
                  <TrendingUp className="feature-icon" />
                  <span>Анализ трендов и прогнозирование</span>
                </div>
                <div className="feature-item">
                  <Sparkles className="feature-icon" />
                  <span>Улучшение и оптимизация контента</span>
                </div>
              </div>
            </div>

            <div className="demo-actions-final">
              <ModernButton type="primary" size="medium">
                <Download size={16} />
                Скачать отчет
              </ModernButton>
              <ModernButton type="outline" size="medium">
                <Share2 size={16} />
                Поделиться результатами
              </ModernButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIIntegrationDemo;
