import React, { useEffect, useState } from 'react';
import './WelcomeScreen.css';
import logo from '../../mascot/modern_government_logo.svg'; // Новый государственный логотип

const WelcomeScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<'company' | 'welcome' | 'finished'>('company');

  useEffect(() => {
    // Фаза 1: Показ названия компании (3 секунды)
    const companyTimer = setTimeout(() => {
      setCurrentPhase('welcome');
    }, 3000);

    // Фаза 2: Показ приветствия (3 секунды после исчезновения первой фразы)
    const welcomeTimer = setTimeout(() => {
      setCurrentPhase('finished');
    }, 6500);

    // Скрытие экрана и завершение
    const finishTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 800);
    }, 8000);

    return () => {
      clearTimeout(companyTimer);
      clearTimeout(welcomeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`welcome-screen${visible ? ' show' : ' hide'}`}>
      {/* Полноэкранный логотип фон */}
      <div className="welcome-logo-background">
        <img src={logo} alt="ППК Единый заказчик" />
      </div>
      
      <div className="welcome-content">
        {/* Название компании */}
        <h1 className={`welcome-title company-name ${currentPhase === 'company' ? 'show' : 'hide'}`}>
          <span className="title-line">
            {'ЕДИНЫЙ ЗАКАЗЧИК'.split('').map((char, index) => (
              <span 
                key={index} 
                className="letter" 
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </h1>

        {/* Приветствие */}
        <h1 className={`welcome-title welcome-text ${currentPhase === 'welcome' ? 'show' : 'hide'}`}>
          <span className="title-line">
            {'ДОБРО ПОЖАЛОВАТЬ'.split('').map((char, index) => (
              <span 
                key={index} 
                className="letter" 
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </h1>
      </div>
    </div>
  );
};

export default WelcomeScreen;
