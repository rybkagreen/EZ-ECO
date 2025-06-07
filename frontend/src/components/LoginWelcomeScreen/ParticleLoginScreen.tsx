import React, { useState, useEffect, useRef } from 'react';
import './ParticleLoginScreen.css';

interface ParticleLoginScreenProps {
  onLogin: (username: string, password: string) => void;
  onContinue?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const ParticleLoginScreen: React.FC<ParticleLoginScreenProps> = ({ onLogin, onContinue }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'form' | 'complete'>('intro');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Создание частиц
  useEffect(() => {
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const colors = ['#007ACC', '#0078D4', '#106EBE', '#005A9E', '#40E0D0', '#4FC3F7'];
      
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.6 + 0.2
        });
      }
      setParticles(newParticles);
    };

    createParticles();
    window.addEventListener('resize', createParticles);
    return () => window.removeEventListener('resize', createParticles);
  }, []);

  // Анимация частиц
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setParticles(prevParticles => 
        prevParticles.map(particle => {
          // Обновление позиции
          let newX = particle.x + particle.vx;
          let newY = particle.y + particle.vy;

          // Отражение от границ
          if (newX < 0 || newX > canvas.width) particle.vx *= -1;
          if (newY < 0 || newY > canvas.height) particle.vy *= -1;

          newX = Math.max(0, Math.min(canvas.width, newX));
          newY = Math.max(0, Math.min(canvas.height, newY));

          // Рисование частицы
          ctx.globalAlpha = particle.opacity;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Создание свечения
          const gradient = ctx.createRadialGradient(newX, newY, 0, newX, newY, particle.size * 3);
          gradient.addColorStop(0, particle.color + '40');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(newX, newY, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();

          return {
            ...particle,
            x: newX,
            y: newY
          };
        })
      );

      // Соединительные линии между близкими частицами
      particles.forEach((particle1, i) => {
        particles.slice(i + 1).forEach(particle2 => {
          const distance = Math.sqrt(
            Math.pow(particle1.x - particle2.x, 2) + 
            Math.pow(particle1.y - particle2.y, 2)
          );

          if (distance < 120) {
            ctx.globalAlpha = (120 - distance) / 120 * 0.2;
            ctx.strokeStyle = '#007ACC';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle1.x, particle1.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles]);

  useEffect(() => {
    // Переход к форме через 4 секунды
    const timer = setTimeout(() => {
      setAnimationPhase('form');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
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
      }, 2000);
    }, 2500);
  };

  const handleDemoLogin = () => {
    setUsername('demo');
    setPassword('demo123');
    setError('');
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="particle-login-screen">
      <canvas ref={canvasRef} className="particle-canvas" />
      
      {/* Волновой фон */}
      <div className="wave-background">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Основной контент */}
      <div className={`content-container ${animationPhase}`}>
        
        {/* Фаза введения */}
        {animationPhase === 'intro' && (
          <div className="intro-phase">
            <div className="logo-container">
              <div className="cyber-logo">
                <div className="logo-core"></div>
                <div className="logo-ring ring-1"></div>
                <div className="logo-ring ring-2"></div>
                <div className="logo-ring ring-3"></div>
              </div>
            </div>
            <h1 className="intro-title">
              <span className="title-line">React Terminal</span>
              <span className="title-line">File Manager</span>
            </h1>
            <div className="intro-subtitle">
              <span className="typing-text">Инициализация системы авторизации</span>
              <span className="cursor">|</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}

        {/* Фаза формы */}
        {animationPhase === 'form' && (
          <div className="form-phase">
            <div className="auth-container">
              <div className="auth-header">
                <h2>Вход в систему</h2>
                <p>Введите ваши учетные данные для доступа</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="username">Пользователь</label>
                  <div className="input-wrapper">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите логин"
                      className={error ? 'error' : ''}
                      disabled={isLoading}
                    />
                    <div className="input-decoration"></div>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="password">Пароль</label>
                  <div className="input-wrapper">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите пароль"
                      className={error ? 'error' : ''}
                      disabled={isLoading}
                    />
                    <div className="input-decoration"></div>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠</span>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-content">
                      <span className="spinner"></span>
                      Проверка...
                    </span>
                  ) : (
                    'Войти'
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={handleDemoLogin}
                  className="demo-button"
                  disabled={isLoading}
                >
                  Демо вход
                </button>
              </form>

              <div className="auth-info">
                <div className="info-item">
                  <span className="info-label">Система:</span>
                  <span className="info-value">React Terminal v2.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Безопасность:</span>
                  <span className="info-value success">Активна</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фаза завершения */}
        {animationPhase === 'complete' && (
          <div className="complete-phase">
            <div className="success-animation">
              <div className="check-circle">
                <div className="check-mark"></div>
              </div>
            </div>
            <h2 className="success-title">Авторизация успешна!</h2>
            <p className="success-message">
              Добро пожаловать в React Terminal File Manager
            </p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Статистика системы */}
      <div className="system-stats">
        <div className="stat-item">
          <span className="stat-label">CPU</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: '45%' }}></div>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">RAM</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: '62%' }}></div>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">NET</span>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: '78%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticleLoginScreen;
