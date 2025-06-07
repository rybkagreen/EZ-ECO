import React, { useState } from 'react';
import './CustomizationPanel.css';

const themes = [
  { name: 'Светлая (голубая)', value: 'light' },
  { name: 'Темная', value: 'dark' }
];

const fontSizes = [
  { name: 'Стандарт', value: '16px' },
  { name: 'Крупный', value: '18px' },
  { name: 'Очень крупный', value: '20px' }
];

const backgrounds = [
  { name: 'Голубой градиент', value: 'gradient' },
  { name: 'Белый', value: 'white' }
];

const CustomizationPanel: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('16px');
  const [background, setBackground] = useState('gradient');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.fontSize = fontSize;
    document.body.style.background = background === 'gradient'
      ? 'linear-gradient(135deg, #e3f0fc 0%, #fafdff 100%)'
      : '#fff';
  }, [theme, fontSize, background]);

  return (
    <div className="customization-panel">
      <h3>Настройки интерфейса</h3>
      <div className="customization-group">
        <label>Тема:</label>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          {themes.map(t => <option key={t.value} value={t.value}>{t.name}</option>)}
        </select>
      </div>
      <div className="customization-group">
        <label>Размер шрифта:</label>
        <select value={fontSize} onChange={e => setFontSize(e.target.value)}>
          {fontSizes.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
        </select>
      </div>
      <div className="customization-group">
        <label>Фон:</label>
        <select value={background} onChange={e => setBackground(e.target.value)}>
          {backgrounds.map(b => <option key={b.value} value={b.value}>{b.name}</option>)}
        </select>
      </div>
    </div>
  );
};

export default CustomizationPanel;
