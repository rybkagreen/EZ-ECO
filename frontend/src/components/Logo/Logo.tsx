import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'header' | 'auth' | 'card';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'header', 
  showText = true,
  className = '' 
}) => {
  return (
    <div className={`logo-container ${variant} ${size} ${className}`}>
      <div className="logo-image-wrapper">
        <img 
          src="/logo-ez.png" 
          alt="Единый Заказчик" 
          className="logo-image"
        />
      </div>
      {showText && (
        <div className="logo-text">
          <span className="logo-title">ЕДИНЫЙ ЗАКАЗЧИК</span>
          {variant === 'auth' && (
            <span className="logo-subtitle">Корпоративная система управления</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
