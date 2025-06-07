import React from 'react';
import './ModernButton.css';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  title?: string;
  pulseAnimation?: boolean;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  type = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  title,
  pulseAnimation = false
}) => {
  return (
    <div className={`modern-btn-container ${size} ${pulseAnimation ? 'pulse-animation' : ''}`}>
      <button
        className={`modern-btn ${type} ${size} ${disabled ? 'disabled' : ''} ${className}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
      >
        <svg width="180" height="60" className="border">
          <polyline points="179,1 179,59 1,59 1,1 179,1" className="bg-line" />
          <polyline points="179,1 179,59 1,59 1,1 179,1" className="hl-line" />
        </svg>
        <span>{children}</span>
      </button>
    </div>
  );
};

export default ModernButton;
