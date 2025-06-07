/**
 * Z-index константы для приложения
 * Используйте эти константы для предотвращения конфликтов слоёв
 */

export const Z_INDEX = {
  // Базовые элементы
  BASE: 1,
  
  // Элементы интерфейса
  DROPDOWN: 100,
  MODAL_BACKDROP: 1000,
  MODAL_CONTENT: 1010,
  
  // Навигация и фиксированные элементы
  HEADER: 1100,
  SIDEBAR: 1050,
  
  // Интерактивные элементы
  CONTEXT_MENU: 1150,
  
  // Уведомления и алерты
  TOAST: 1200,
  
  // Критические элементы (должны быть поверх всего)
  LOADING_OVERLAY: 9000,
  ERROR_BOUNDARY: 9999,
} as const;

export default Z_INDEX;
