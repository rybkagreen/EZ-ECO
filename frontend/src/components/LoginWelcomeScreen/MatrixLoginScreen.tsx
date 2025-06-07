import React, { useState, useEffect, useRef } from 'react';
import './MatrixLoginScreen.css';

interface MatrixLoginScreenProps {
  onLogin: (username: string, password: string) => void;
  onContinue?: () => void;
}

const MatrixLoginScreen: React.FC<MatrixLoginScreenProps> = ({ onLogin, onContinue }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'form' | 'complete'>('intro');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Матричная анимация
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    // Инициализация капель
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      // Создание fade эффекта
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Зеленый цвет для букв
      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';

      // Рисование букв
      for (let i = 0; i < drops.length; i++) {
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
        ctx.fillStyle = '#0F0';
        
        // Яркость уменьшается к низу
        const alpha = Math.max(0, 1 - (drops[i] * fontSize) / canvas.height);
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Сброс капли наверх случайным образом
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Переход к форме через 5 секунд
    const timer = setTimeout(() => {
      setAnimationPhase('form');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('ACCESS DENIED: Incomplete credentials');
      return;
    }

    setIsLoading(true);
    setError('');

    // Симуляция процесса авторизации
    setTimeout(() => {
      setIsLoading(false);
      setAnimationPhase('complete');
      
      // Успешная авторизация
      setTimeout(() => {
        onLogin(username, password);
        if (onContinue) {
          onContinue();
        }
      }, 3000);
    }, 3000);
  };

  const handleDemoLogin = () => {
    setUsername('neo');
    setPassword('matrix');
    setError('');
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="matrix-login-screen">
      <canvas ref={canvasRef} className="matrix-canvas" />
      
      {/* Основной контент */}
      <div className={`matrix-content ${animationPhase}`}>
        
        {/* Фаза введения */}
        {animationPhase === 'intro' && (
          <div className="matrix-intro">
            <div className="matrix-logo">
              <div className="digital-grid">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`grid-cell cell-${i}`}></div>
                ))}
              </div>
            </div>
            
            <div className="terminal-text">
              <div className="code-line">
                <span className="prompt">root@matrix:~$ </span>
                <span className="typing">initializing_secure_connection</span>
              </div>
              <div className="code-line delay-1">
                <span className="prompt">root@matrix:~$ </span>
                <span className="typing">loading_authentication_protocol</span>
              </div>
              <div className="code-line delay-2">
                <span className="prompt">root@matrix:~$ </span>
                <span className="typing">establishing_neural_link</span>
              </div>
              <div className="code-line delay-3">
                <span className="status success">CONNECTION ESTABLISHED</span>
              </div>
            </div>

            <div className="system-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">SYSTEM:</span>
                  <span className="value">MATRIX v13.7</span>
                </div>
                <div className="info-item">
                  <span className="label">SECURITY:</span>
                  <span className="value green">ACTIVE</span>
                </div>
                <div className="info-item">
                  <span className="label">NODES:</span>
                  <span className="value">2,847,392</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фаза формы */}
        {animationPhase === 'form' && (
          <div className="matrix-form">
            <div className="access-panel">
              <div className="panel-header">
                <div className="terminal-title">
                  <span className="bracket">[</span>
                  <span className="title-text">ACCESS CONTROL</span>
                  <span className="bracket">]</span>
                </div>
                <div className="subtitle">AUTHENTICATION REQUIRED</div>
              </div>

              <form onSubmit={handleSubmit} className="terminal-form">
                <div className="input-section">
                  <div className="input-label">
                    <span className="prompt">&gt;</span>
                    <span>USERNAME:</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter user identification"
                    className={`matrix-input ${error ? 'error' : ''}`}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                <div className="input-section">
                  <div className="input-label">
                    <span className="prompt">&gt;</span>
                    <span>PASSWORD:</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access code"
                    className={`matrix-input ${error ? 'error' : ''}`}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="error-display">
                    <span className="error-symbol">X</span>
                    <span className="error-text">{error}</span>
                  </div>
                )}

                <div className="button-section">
                  <button 
                    type="submit" 
                    className="access-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-text">
                        <span className="loading-bar"></span>
                        AUTHENTICATING...
                      </span>
                    ) : (
                      'AUTHENTICATE'
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleDemoLogin}
                    className="demo-access-button"
                    disabled={isLoading}
                  >
                    DEMO ACCESS
                  </button>
                </div>
              </form>

              <div className="security-status">
                <div className="status-line">
                  <span className="status-label">ENCRYPTION:</span>
                  <span className="status-value">AES-256</span>
                </div>
                <div className="status-line">
                  <span className="status-label">FIREWALL:</span>
                  <span className="status-value green">ENABLED</span>
                </div>
                <div className="status-line">
                  <span className="status-label">INTRUSION:</span>
                  <span className="status-value">NONE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фаза завершения */}
        {animationPhase === 'complete' && (
          <div className="matrix-complete">
            <div className="access-granted">
              <div className="success-symbol">
                <div className="check-matrix"></div>
              </div>
              <div className="success-text">ACCESS GRANTED</div>
              <div className="welcome-message">
                Welcome to the Matrix, {username || 'User'}
              </div>
            </div>

            <div className="loading-sequence">
              <div className="sequence-item">
                <span className="sequence-text">Loading neural pathways...</span>
                <span className="sequence-status">OK</span>
              </div>
              <div className="sequence-item">
                <span className="sequence-text">Initializing reality engine...</span>
                <span className="sequence-status">OK</span>
              </div>
              <div className="sequence-item">
                <span className="sequence-text">Establishing connection...</span>
                <span className="sequence-status">OK</span>
              </div>
            </div>

            <div className="final-prompt">
              <span className="prompt">root@matrix:~$ </span>
              <span className="typing-final">welcome_to_the_real_world</span>
            </div>
          </div>
        )}
      </div>

      {/* Системные индикаторы */}
      <div className="system-indicators">
        <div className="indicator">
          <span className="indicator-dot green"></span>
          <span className="indicator-label">CONN</span>
        </div>
        <div className="indicator">
          <span className="indicator-dot yellow"></span>
          <span className="indicator-label">PROC</span>
        </div>
        <div className="indicator">
          <span className="indicator-dot red"></span>
          <span className="indicator-label">WARN</span>
        </div>
      </div>

      {/* Матричные символы в углах */}
      <div className="corner-symbols">
        <div className="corner top-left">
          <span className="symbol">╔</span>
        </div>
        <div className="corner top-right">
          <span className="symbol">╗</span>
        </div>
        <div className="corner bottom-left">
          <span className="symbol">╚</span>
        </div>
        <div className="corner bottom-right">
          <span className="symbol">╝</span>
        </div>
      </div>
    </div>
  );
};

export default MatrixLoginScreen;
