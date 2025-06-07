# 🎨 ДИЗАЙН-СИСТЕМА ЭКОСИСТЕМЫ "ЕДИНЫЙ ЗАКАЗЧИК"

## 📋 ПРИНЦИПЫ ДИЗАЙНА ДЛЯ ВСЕХ МОДУЛЕЙ

### 🎨 **Цветовая палитра**
```css
/* Основные цвета */
--primary-white: #ffffff;
--accent-blue-400: #60a5fa;
--accent-blue-500: #3b82f6;
--accent-blue-600: #2563eb;
--accent-blue-300: #93c5fd;
--accent-blue-100: #dbeafe;

/* Текст */
--text-primary: #1e293b;
--text-secondary: #64748b;
--text-muted: #94a3b8;

/* Градиенты */
--gradient-primary: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
--gradient-accent: linear-gradient(135deg, #3b82f6, #1d4ed8);
--gradient-text: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);

/* Тени */
--shadow-blue-sm: 0 2px 8px rgba(59, 130, 246, 0.1);
--shadow-blue-md: 0 4px 16px rgba(59, 130, 246, 0.15);
--shadow-blue-lg: 0 8px 32px rgba(59, 130, 246, 0.2);
```

### 🔳 **Формы и радиусы**
```css
/* Квадратные формы с мягкими углами */
--border-radius-sm: 6px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
--border-radius-xl: 16px;

/* Границы */
--border-light: 2px solid rgba(59, 130, 246, 0.2);
--border-medium: 2px solid rgba(59, 130, 246, 0.4);
--border-focus: 2px solid #3b82f6;
```

### ✨ **Анимации блеска (обязательно для всех кнопок)**
```css
/* Shimmer анимация для границ */
@keyframes shimmer {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
}

/* Применение к кнопкам */
.btn-ecosystem::after {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    background: linear-gradient(45deg, 
        transparent, #60a5fa, transparent, #3b82f6, 
        transparent, #60a5fa, transparent);
    background-size: 400% 400%;
    border-radius: inherit;
    z-index: -1;
    animation: shimmer 3s ease-in-out infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.btn-ecosystem:hover::after {
    opacity: 1;
}
```

## 🏗️ **СТРУКТУРА МОДУЛЕЙ ЭКОСИСТЕМЫ**

### 1. **📁 Модуль "Архив"**
```
🎨 Дизайн:
- Белый фон с голубым паттерном
- Древовидная структура файлов с голубыми иконками
- Карточки документов с анимацией блеска
- Логотип EZ в шапке модуля

🔧 Функционал:
- Автоматическая категоризация документов
- Векторный поиск с embedding
- Версионирование файлов
- Права доступа по ролям
```

### 2. **📊 Модуль "Аналитика"**
```
🎨 Дизайн:
- Белые карточки дашборда с голубыми акцентами
- Графики и диаграммы в голубых тонах
- Анимированные виджеты с эффектами hover
- Адаптивная сетка для всех экранов

🔧 Функционал:
- Real-time дашборды
- KPI трекинг проектов
- Прогнозирование на основе ML
- Экспорт отчетов в PDF/Excel
```

### 3. **🤖 Модуль "ИИ-Ассистент"**
```
🎨 Дизайн:
- Чат-интерфейс с белыми пузырями сообщений
- Голубые акценты для ИИ-ответов
- Анимированные индикаторы печати
- Кнопки быстрых действий с shimmer эффектами

🔧 Функционал:
- Обработка документов через AI
- Умные рекомендации
- Автоматическое тегирование
- Голосовые команды
```

### 4. **📋 Модуль "Проекты"**
```
🎨 Дизайн:
- Канбан-доски с белыми карточками
- Голубые статус-индикаторы
- Временные шкалы с анимацией
- Диаграммы Гантта в корпоративных цветах

🔧 Функционал:
- Управление задачами
- Трекинг времени
- Планирование ресурсов
- Интеграция с архивом
```

### 5. **👥 Модуль "Команда"**
```
🎨 Дизайн:
- Профили сотрудников в белых карточках
- Голубые бейджи ролей и статусов
- Календарь с современным дизайном
- Чат с анимированными уведомлениями

🔧 Функционал:
- Управление пользователями
- Календарь встреч
- Внутренний мессенджер
- Система уведомлений
```

## 🧩 **КОМПОНЕНТЫ ДИЗАЙН-СИСТЕМЫ**

### **Кнопки**
```css
/* Основная кнопка */
.btn-primary {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    position: relative;
    transition: all 0.3s ease;
}

/* Вторичная кнопка */
.btn-secondary {
    background: rgba(255, 255, 255, 0.95);
    color: #3b82f6;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
}

/* Кнопка успеха */
.btn-success {
    background: linear-gradient(135deg, #10b981, #059669);
    border: 2px solid transparent;
}

/* Опасная кнопка */
.btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: 2px solid transparent;
}
```

### **Карточки**
```css
.card-ecosystem {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(20px);
    transition: all 0.3s ease;
}

.card-ecosystem:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
}
```

### **Поля ввода**
```css
.input-ecosystem {
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.input-ecosystem:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
}
```

### **Навигация**
```css
.nav-ecosystem {
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 2px solid rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(20px);
    padding: 16px 24px;
}

.nav-item {
    color: #64748b;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.nav-item.active,
.nav-item:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
}
```

## 📱 **АДАПТИВНОСТЬ**

### **Брейкпоинты**
```css
/* Мобильные */
@media (max-width: 768px) {
    .container-ecosystem { padding: 16px; }
    .card-ecosystem { padding: 16px; }
    .btn-primary { padding: 10px 20px; font-size: 14px; }
}

/* Планшеты */
@media (min-width: 769px) and (max-width: 1024px) {
    .container-ecosystem { padding: 20px; }
}

/* Десктопы */
@media (min-width: 1025px) {
    .container-ecosystem { padding: 32px; }
}
```

### **Сетка модулей**
```css
.modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    padding: 24px;
}

@media (max-width: 768px) {
    .modules-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
    }
}
```

## 🏷️ **БРЕНДИНГ**

### **Логотип EZ**
- Размещается в верхнем левом углу каждого модуля
- Адаптивные размеры: 120px (desktop), 80px (tablet), 60px (mobile)
- Анимация при hover: scale(1.05) + тень

### **Типографика**
```css
/* Заголовки */
.h1-ecosystem { 
    font-size: 2.5rem; 
    font-weight: 700; 
    background: var(--gradient-text);
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.h2-ecosystem { 
    font-size: 2rem; 
    font-weight: 600; 
    color: var(--text-primary);
}

.h3-ecosystem { 
    font-size: 1.5rem; 
    font-weight: 600; 
    color: var(--text-secondary);
}

/* Основной текст */
.text-ecosystem { 
    font-size: 1rem; 
    line-height: 1.6; 
    color: var(--text-secondary);
}
```

## 🎯 **ПРИМЕНЕНИЕ К МОДУЛЯМ**

Каждый новый модуль экосистемы будет:
1. ✅ Использовать белый фон с голубыми акцентами
2. ✅ Иметь анимации блеска на всех кнопках
3. ✅ Содержать логотип EZ Company
4. ✅ Следовать квадратным формам (8px border-radius)
5. ✅ Быть полностью адаптивным
6. ✅ Использовать единую типографику
7. ✅ Иметь консистентную навигацию

---
*Дизайн-система "Единый Заказчик" для экосистемы EZ Company*
