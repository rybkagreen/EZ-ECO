/**
 * Утилиты для совместимости и производительности
 */

// Проверка поддержки современных возможностей браузера
export const browserSupport = {
  // Проверка поддержки IntersectionObserver для lazy loading
  intersectionObserver: typeof IntersectionObserver !== 'undefined',
  
  // Проверка поддержки ResizeObserver для адаптивных компонентов
  resizeObserver: typeof ResizeObserver !== 'undefined',
  
  // Проверка поддержки Web Workers
  webWorkers: typeof Worker !== 'undefined',
  
  // Проверка поддержки WebGL для Canvas анимаций
  webgl: (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  })(),
};

// Debounce функция для оптимизации событий
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Throttle функция для ограничения частоты вызовов
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Проверка производительности устройства
export const getDevicePerformance = (): 'low' | 'medium' | 'high' => {
  // Простая эвристика на основе navigator
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;
  
  if (memory >= 8 && cores >= 8) return 'high';
  if (memory >= 4 && cores >= 4) return 'medium';
  return 'low';
};

// Префедирование критически важных ресурсов
export const preloadCriticalResources = () => {
  // Префедирование шрифтов
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.onload = () => {
    fontLink.rel = 'stylesheet';
  };
  document.head.appendChild(fontLink);
};

// Оптимизация изображений
export const getOptimizedImageUrl = (url: string, width: number, quality = 85): string => {
  // В реальном приложении здесь может быть логика для сервиса оптимизации изображений
  return url;
};

export default {
  browserSupport,
  debounce,
  throttle,
  getDevicePerformance,
  preloadCriticalResources,
  getOptimizedImageUrl,
};
