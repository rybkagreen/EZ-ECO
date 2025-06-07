import React, { useState, useEffect, useCallback } from 'react';
import './AdvancedAnimations.css';

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay: number;
}

export interface AdvancedAnimationsProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'elastic' | 'matrix' | 'particle';
  direction?: 'up' | 'down' | 'left' | 'right' | 'center';
  duration?: number;
  delay?: number;
  trigger?: 'hover' | 'click' | 'scroll' | 'load' | 'focus';
  infinite?: boolean;
  playState?: 'running' | 'paused';
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

const AdvancedAnimations: React.FC<AdvancedAnimationsProps> = ({
  children,
  className = '',
  animationType = 'fade',
  direction = 'up',
  duration = 300,
  delay = 0,
  trigger = 'load',
  infinite = false,
  playState = 'running',
  onAnimationStart,
  onAnimationEnd,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // Intersection Observer for scroll trigger
  useEffect(() => {
    if (trigger === 'scroll' && elementRef) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              onAnimationStart?.();
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(elementRef);
      return () => observer.disconnect();
    }
  }, [elementRef, trigger, onAnimationStart]);

  // Load trigger
  useEffect(() => {
    if (trigger === 'load') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        onAnimationStart?.();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, onAnimationStart]);

  // Animation end handler
  const handleAnimationEnd = useCallback(() => {
    onAnimationEnd?.();
    if (!infinite && trigger === 'click') {
      setIsClicked(false);
    }
  }, [onAnimationEnd, infinite, trigger]);

  // Event handlers
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsHovered(true);
      onAnimationStart?.();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsHovered(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsClicked(true);
      onAnimationStart?.();
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setIsFocused(true);
      onAnimationStart?.();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsFocused(false);
    }
  };

  // Determine if animation should be active
  const shouldAnimate = () => {
    switch (trigger) {
      case 'load':
      case 'scroll':
        return isVisible;
      case 'hover':
        return isHovered;
      case 'click':
        return isClicked;
      case 'focus':
        return isFocused;
      default:
        return false;
    }
  };

  // Generate animation class names
  const getAnimationClasses = () => {
    const classes = ['advanced-animation'];
    
    if (shouldAnimate()) {
      classes.push(`animate-${animationType}`);
      classes.push(`animate-${animationType}-${direction}`);
      
      if (infinite) {
        classes.push('animate-infinite');
      }
      
      if (playState === 'paused') {
        classes.push('animate-paused');
      }
    }
    
    return classes.join(' ');
  };

  // Custom CSS properties for dynamic values
  const customStyle: React.CSSProperties & Record<string, string> = {
    '--animation-duration': `${duration}ms`,
    '--animation-delay': `${delay}ms`,
    animationPlayState: playState,
  };

  return (
    <div
      ref={setElementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={customStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onAnimationEnd={handleAnimationEnd}
      tabIndex={trigger === 'focus' ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Higher-order component for easy animation wrapping
export const withAdvancedAnimation = (
  Component: React.ComponentType<any>,
  animationProps: Partial<AdvancedAnimationsProps> = {}
) => {
  return React.forwardRef<any, any>((props, ref) => (
    <AdvancedAnimations {...animationProps}>
      <Component {...props} ref={ref} />
    </AdvancedAnimations>
  ));
};

// Animation presets
export const AnimationPresets = {
  fadeInUp: {
    animationType: 'fade' as const,
    direction: 'up' as const,
    duration: 600,
    trigger: 'scroll' as const,
  },
  slideInLeft: {
    animationType: 'slide' as const,
    direction: 'left' as const,
    duration: 500,
    trigger: 'scroll' as const,
  },
  scaleOnHover: {
    animationType: 'scale' as const,
    direction: 'center' as const,
    duration: 200,
    trigger: 'hover' as const,
  },
  bounceOnClick: {
    animationType: 'bounce' as const,
    direction: 'center' as const,
    duration: 600,
    trigger: 'click' as const,
  },
  elasticScale: {
    animationType: 'elastic' as const,
    direction: 'center' as const,
    duration: 800,
    trigger: 'hover' as const,
  },
  matrixGlitch: {
    animationType: 'matrix' as const,
    direction: 'center' as const,
    duration: 1000,
    trigger: 'hover' as const,
  },
  particleExplosion: {
    animationType: 'particle' as const,
    direction: 'center' as const,
    duration: 1200,
    trigger: 'click' as const,
  },
};

// Animation sequence component for complex animations
export const AnimationSequence: React.FC<{
  children: React.ReactNode[];
  stagger?: number;
  className?: string;
}> = ({ children, stagger = 100, className = '' }) => {
  return (
    <div className={`animation-sequence ${className}`}>
      {React.Children.map(children, (child, index) => (
        <AdvancedAnimations
          key={index}
          animationType="fade"
          direction="up"
          delay={index * stagger}
          trigger="scroll"
        >
          {child}
        </AdvancedAnimations>
      ))}
    </div>
  );
};

// Performance-optimized animation hook
export const useOptimizedAnimation = (
  duration: number = 300,
  easing: string = 'ease-out'
) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  }, [duration]);

  const animationStyles = {
    transition: `all ${duration}ms ${easing}`,
    willChange: isAnimating ? 'transform, opacity' : 'auto',
  };

  return { isAnimating, startAnimation, animationStyles };
};

export default AdvancedAnimations;
