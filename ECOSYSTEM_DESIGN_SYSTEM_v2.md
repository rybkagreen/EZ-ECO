# 🎨 ДИЗАЙН-СИСТЕМА ЭКОСИСТЕМЫ "ЕДИНЫЙ ЗАКАЗЧИК" v2.0

## 📋 ОБЩИЕ ПРИНЦИПЫ ДИЗАЙНА

### 🎯 **Философия дизайна:**
- **Минималистичный подход** с акцентом на функциональность
- **Эргономичность интерфейса** и удобство использования
- **Адаптивность** под различные устройства и разрешения
- **Интуитивная навигация** с понятной структурой

---

## 🎨 ЦВЕТОВОЕ РЕШЕНИЕ

### **Основная палитра:**
```css
:root {
  /* Основные цвета */
  --primary-white: #FFFFFF;           /* Основной фон */
  --accent-blue: #00ADEF;             /* Акцентный голубой */
  --accent-blue-light: #33BDFF;       /* Светлый голубой */
  --accent-blue-dark: #0082BC;        /* Темный голубой */
  
  /* Градиенты */
  --gradient-primary: linear-gradient(135deg, #FFFFFF 0%, #F5FBFF 100%);
  --gradient-accent: linear-gradient(135deg, #00ADEF 0%, #33BDFF 100%);
  --gradient-subtle: linear-gradient(180deg, #FFFFFF 0%, #F8FCFF 100%);
  
  /* Вспомогательные цвета */
  --text-primary: #2C3E50;            /* Основной текст */
  --text-secondary: #7F8C8D;          /* Вторичный текст */
  --text-muted: #BDC3C7;              /* Приглушенный текст */
  --border-light: #ECF0F1;            /* Светлые границы */
  --border-medium: #D5DBDB;           /* Средние границы */
  
  /* Состояния */
  --success: #27AE60;                 /* Успех */
  --warning: #F39C12;                 /* Предупреждение */
  --error: #E74C3C;                   /* Ошибка */
  --info: #3498DB;                    /* Информация */
}
```

---

## 🔤 ТИПОГРАФИКА

### **Шрифтовая иерархия:**
```css
/* Основные шрифты - современные sans-serif */
:root {
  --font-primary: 'Inter', 'Segoe UI', 'Roboto', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  
  /* Размеры */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  
  /* Высота строки */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Выравнивание */
  --text-align: left;     /* Преимущественно по левому краю */
}

/* Заголовки */
.heading-1 { font-size: var(--text-4xl); font-weight: 700; line-height: var(--leading-tight); }
.heading-2 { font-size: var(--text-3xl); font-weight: 600; line-height: var(--leading-tight); }
.heading-3 { font-size: var(--text-2xl); font-weight: 600; line-height: var(--leading-normal); }
.heading-4 { font-size: var(--text-xl); font-weight: 500; line-height: var(--leading-normal); }

/* Основной текст */
.body-large { font-size: var(--text-lg); line-height: var(--leading-relaxed); }
.body-base { font-size: var(--text-base); line-height: var(--leading-normal); }
.body-small { font-size: var(--text-sm); line-height: var(--leading-normal); }
.caption { font-size: var(--text-xs); line-height: var(--leading-normal); }
```

---

## 🔲 ЭЛЕМЕНТЫ ИНТЕРФЕЙСА

### **1. Формы - строго прямоугольные с четкими краями:**
```css
.form-container {
  background: var(--primary-white);
  border: 2px solid var(--border-light);
  border-radius: 0;                    /* Строго прямоугольные */
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 173, 239, 0.1);
}
```

### **2. Кнопки - современные с эффектом параллакса:**
```css
.btn-primary {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: var(--gradient-accent);
  color: var(--primary-white);
  border: none;
  border-radius: 0;                    /* Четкие геометрические формы */
  font-family: var(--font-primary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 173, 239, 0.3);
}

/* Эффект параллакса и анимация границ */
.btn-primary::before {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  background: linear-gradient(45deg, 
    transparent, var(--accent-blue-light), transparent, 
    var(--accent-blue), transparent, var(--accent-blue-light), transparent);
  background-size: 400% 400%;
  border-radius: 0;
  z-index: -1;
  animation: borderShimmer 3s ease-in-out infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 173, 239, 0.4);
}

@keyframes borderShimmer {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}
```

### **3. Поля ввода - прямоугольные с мягкими скруглениями:**
```css
.input-field {
  width: 100%;
  padding: 16px 20px;
  background: var(--primary-white);
  border: 2px solid var(--border-light);
  border-radius: 4px;                  /* Мягкие скругления */
  font-family: var(--font-primary);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: all 0.3s ease;
  outline: none;
}

/* Визуальная обратная связь при фокусе */
.input-field:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(0, 173, 239, 0.1);
  background: var(--gradient-subtle);
}

/* Индикаторы состояния */
.input-field.success { border-color: var(--success); }
.input-field.warning { border-color: var(--warning); }
.input-field.error { border-color: var(--error); }
```

---

## 📐 КОМПОНОВКА

### **Сетка и отступы:**
```css
:root {
  /* Модульная сетка */
  --grid-cols-1: repeat(1, minmax(0, 1fr));
  --grid-cols-2: repeat(2, minmax(0, 1fr));
  --grid-cols-3: repeat(3, minmax(0, 1fr));
  --grid-cols-4: repeat(4, minmax(0, 1fr));
  --grid-cols-12: repeat(12, minmax(0, 1fr));
  
  /* Равномерные отступы */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
  
  /* Контейнеры */
  --container-xs: 480px;
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}

.container {
  width: 100%;
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Строгие линии выравнивания */
.grid {
  display: grid;
  gap: var(--spacing-lg);
  align-items: start;
}

.flex {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
```

---

## 🎭 АНИМАЦИИ И ПЕРЕХОДЫ

### **Плавные эффекты:**
```css
:root {
  /* Временные функции */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Длительности */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* Микроинтеракции */
.interactive-element {
  transition: all var(--duration-normal) var(--ease-out);
}

.interactive-element:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 173, 239, 0.15);
}

/* Анимация появления */
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  0% { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-fade-in { animation: fadeInUp var(--duration-slow) var(--ease-out); }
.animate-slide-in { animation: slideInRight var(--duration-normal) var(--ease-out); }
```

---

## 🎨 ДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ

### **Иконки - современные векторные:**
```css
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-sm { width: 16px; height: 16px; }
.icon-lg { width: 32px; height: 32px; }
.icon-xl { width: 48px; height: 48px; }
```

### **Разделители - четкие линии:**
```css
.divider-horizontal {
  width: 100%;
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-lg) 0;
}

.divider-vertical {
  width: 1px;
  height: 100%;
  background: var(--border-light);
  margin: 0 var(--spacing-lg);
}
```

### **Подсказки - ненавязчивые:**
```css
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: var(--primary-white);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  font-size: var(--text-xs);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.tooltip:hover::after {
  opacity: 1;
}
```

---

## 📱 АДАПТИВНОСТЬ

### **Responsive breakpoints:**
```css
/* Mobile First подход */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* Адаптивная типографика */
@media (max-width: 767px) {
  .heading-1 { font-size: var(--text-3xl); }
  .heading-2 { font-size: var(--text-2xl); }
  .heading-3 { font-size: var(--text-xl); }
  
  .container { padding: 0 var(--spacing-md); }
  .btn-primary { padding: 10px 16px; font-size: var(--text-sm); }
}
```

---

## ✅ ТРЕБОВАНИЯ К РЕАЛИЗАЦИИ

### **Производительность:**
- Оптимизация CSS с использованием критического пути
- Lazy loading для изображений и компонентов
- Минификация и сжатие ресурсов

### **Кроссбраузерность:**
- Поддержка Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Полифиллы для современных CSS функций
- Graceful degradation для старых браузеров

### **Доступность (A11y):**
- Семантическая разметка HTML
- ARIA атрибуты для интерактивных элементов
- Клавиатурная навигация
- Цветовой контраст не менее 4.5:1

---

## 🎯 ПРИМЕНЕНИЕ В МОДУЛЯХ

### **Архив:**
- Белый фон с акцентным голубым (#00ADEF)
- Прямоугольные карточки документов
- Анимированные кнопки действий
- Строгая сетка для списков файлов

### **Аналитика:**
- Градиентные фоны для дашбордов
- Голубые акценты для графиков
- Минималистичные карточки метрик
- Плавные анимации переходов

### **Файловый менеджер:**
- Обновление текущих цветов на #00ADEF
- Прямоугольные превью файлов
- Эффекты параллакса для кнопок
- Строгое выравнивание элементов

---

*Эта дизайн-система обеспечивает единообразный, современный и функциональный интерфейс для всей экосистемы "Единый Заказчик".*
