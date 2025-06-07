import React, { useState, useEffect } from 'react';
import './LoginWelcomeScreen.css';

interface LoginWelcomeScreenProps {
  onLogin: (username: string, password: string) => void;
  onContinue?: () => void;
}

const LoginWelcomeScreen: React.FC<LoginWelcomeScreenProps> = ({ onLogin, onContinue }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'form' | 'complete'>('intro');
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Поля для регистрации
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [subdivision, setSubdivision] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Переход к форме через 3 секунды
    const timer = setTimeout(() => {
      setAnimationPhase('form');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentMode === 'login') {
      if (!username.trim() || !password.trim()) {
        setError('Пожалуйста, заполните все поля');
        return;
      }
    } else {
      if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !department.trim() || !subdivision.trim()) {
        setError('Пожалуйста, заполните все поля');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        setError('Введите корректный email адрес');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    // Симуляция процесса авторизации/регистрации
    setTimeout(() => {
      setIsLoading(false);
      setAnimationPhase('complete');
      
      // Успешная операция
      setTimeout(() => {
        if (currentMode === 'login') {
          onLogin(username, password);
        } else {
          onLogin(email, password); // Используем email как логин при регистрации
        }
        if (onContinue) {
          onContinue();
        }
      }, 1500);
    }, 2000);
  };

  const handleDemoLogin = () => {
    setCurrentMode('login');
    setUsername('demo@company.com');
    setPassword('demo123');
    setError('');
  };

  const switchMode = () => {
    setCurrentMode(currentMode === 'login' ? 'register' : 'login');
    setError('');
    // Очищаем поля при переключении
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setDepartment('');
    setSubdivision('');
    setConfirmPassword('');
  };

  return (
    <div className={`login-welcome-screen ${animationPhase}`}>
      {/* Корпоративный логотип в углу */}
      <div className="corporate-logo-corner">
        <img src="/logo-ez.png" alt="Единый Заказчик" />
        <div>
          <div className="corporate-brand-text">ЕДИНЫЙ ЗАКАЗЧИК</div>
          <div className="corporate-brand-subtitle">Корпоративная система</div>
        </div>
      </div>

      {/* Анимированный фон */}
      <div className="login-background">
        <div className="floating-shapes">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`floating-shape shape-${i + 1}`} />
          ))}
        </div>
        <div className="gradient-overlay" />
      </div>

      {/* Логотип и заголовок - появляются первыми */}
      <div className={`welcome-intro ${animationPhase === 'intro' ? 'visible' : 'hidden'}`}>
        <div className="company-logo">
          <div className="logo-circle">
            <div className="logo-inner">
              <span className="logo-text">УЗ</span>
            </div>
          </div>
        </div>
        
        <h1 className="company-title">
          <span className="title-main">ЕДИНЫЙ ЗАКАЗЧИК</span>
          <span className="title-sub">Корпоративная система управления</span>
        </h1>
        
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Форма авторизации - появляется после intro */}
      <div className={`login-form-container ${animationPhase === 'form' || animationPhase === 'complete' ? 'visible' : 'hidden'}`}>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="mini-logo">
                <img src="/logo-ez.png" alt="EZ Logo" />
              </div>
            </div>
            <h2>{currentMode === 'login' ? 'Добро пожаловать' : 'Регистрация в системе'}</h2>
            <p>{currentMode === 'login' ? 'Войдите в систему для продолжения работы' : 'Создайте учетную запись для доступа к системе'}</p>
          </div>

          {animationPhase === 'complete' ? (
            <div className="success-message">
              <div className="success-icon">
                <svg viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="25" fill="#3B82F6" />
                  <path 
                    d="M16 25l6 6 12-12" 
                    stroke="white" 
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>{currentMode === 'login' ? 'Авторизация успешна!' : 'Регистрация завершена!'}</h3>
              <p>{currentMode === 'login' ? 'Перенаправляем в систему...' : 'Добро пожаловать в систему!'}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {currentMode === 'register' && (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName">ФИО</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Введите ваше полное имя"
                        required
                        autoComplete="name"
                      />
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Корпоративная почта</label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        autoComplete="email"
                      />
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="department">Департамент</label>
                    <div className="input-wrapper">
                      <select
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                      >
                        <option value="">Выберите департамент</option>
                        <option value="it">IT и Цифровые технологии</option>
                        <option value="finance">Финансы и Экономика</option>
                        <option value="hr">Управление персоналом</option>
                        <option value="legal">Юридический департамент</option>
                        <option value="procurement">Закупки и Снабжение</option>
                        <option value="operations">Операционное управление</option>
                        <option value="marketing">Маркетинг и PR</option>
                        <option value="quality">Качество и Аудит</option>
                      </select>
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subdivision">Структурное подразделение</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="subdivision"
                        value={subdivision}
                        onChange={(e) => setSubdivision(e.target.value)}
                        placeholder="Например: Отдел разработки"
                        required
                        autoComplete="organization"
                      />
                      <div className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentMode === 'login' && (
                <div className="form-group">
                  <label htmlFor="username">Логин или Email</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите ваш логин"
                      required
                      autoComplete="username"
                    />
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <div className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
              </div>

              {currentMode === 'register' && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Подтвердите пароль</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      required
                      autoComplete="new-password"
                    />
                    <div className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="#EF4444" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="#EF4444" strokeWidth="2"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`login-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>{currentMode === 'login' ? 'Авторизация...' : 'Регистрация...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{currentMode === 'login' ? 'Войти в систему' : 'Зарегистрироваться'}</span>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </>
                  )}
                </button>

                {currentMode === 'login' && (
                  <button 
                    type="button" 
                    className="demo-btn"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    Демо вход
                  </button>
                )}

                <button 
                  type="button" 
                  className="mode-switch-btn"
                  onClick={switchMode}
                  disabled={isLoading}
                >
                  {currentMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </div>

              <div className="form-footer">
                {currentMode === 'login' && (
                  <>
                    <a href="#forgot" className="forgot-link">Забыли пароль?</a>
                    <span className="divider">•</span>
                  </>
                )}
                <a href="#support" className="support-link">Техподдержка</a>
                {currentMode === 'register' && (
                  <>
                    <span className="divider">•</span>
                    <a href="#policy" className="policy-link">Политика конфиденциальности</a>
                  </>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Информационная панель */}
        <div className="info-panel">
          <div className="info-item">
            <div className="info-icon">🔒</div>
            <div>
              <h4>Безопасность</h4>
              <p>Многофакторная аутентификация</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">☁️</div>
            <div>
              <h4>Облачное хранение</h4>
              <p>Синхронизация данных</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🤖</div>
            <div>
              <h4>ИИ Помощник</h4>
              <p>Интеллектуальная обработка</p>
            </div>
          </div>
        </div>
      </div>

      {/* Статусная панель внизу */}
      <div className="status-panel">
        <div className="status-info">
          <div className="status-indicator online" />
          <span>Система работает стабильно</span>
        </div>
        <div className="version-info">
          <span>v2.1.0 • {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
};

export default LoginWelcomeScreen;
