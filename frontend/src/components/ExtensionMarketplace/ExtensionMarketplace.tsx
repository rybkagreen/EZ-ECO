import React, { useState } from 'react';
import { 
  Package, 
  Download, 
  Star, 
  Shield, 
  Zap, 
  FileText,
  Calculator,
  Brain,
  Search,
  Filter
} from 'lucide-react';
import ModernButton from '../ModernButton';
import './ExtensionMarketplace.css';

interface Extension {
  id: string;
  name: string;
  description: string;
  category: 'office' | 'ai' | 'productivity' | 'analysis';
  icon: React.ReactNode;
  rating: number;
  downloads: string;
  verified: boolean;
  installed: boolean;
  version: string;
  tags: string[];
}

const extensions: Extension[] = [
  {
    id: 'excel-ai-analyzer',
    name: 'Excel AI Analyzer',
    description: 'Анализ данных Excel с помощью ИИ. Автоматическое создание отчетов и визуализаций.',
    category: 'office',
    icon: <Calculator className="extension-icon" />,
    rating: 4.8,
    downloads: '50K+',
    verified: true,
    installed: false,
    version: '2.1.0',
    tags: ['Excel', 'AI', 'Analytics', 'Reports']
  },
  {
    id: 'word-smart-editor',
    name: 'Word Smart Editor',
    description: 'Умный редактор документов с ИИ-помощником для проверки стиля и структуры.',
    category: 'office',
    icon: <FileText className="extension-icon" />,
    rating: 4.6,
    downloads: '35K+',
    verified: true,
    installed: true,
    version: '1.8.2',
    tags: ['Word', 'AI', 'Writing', 'Grammar']
  },
  {
    id: 'pdf-ai-processor',
    name: 'PDF AI Processor',
    description: 'Извлечение и анализ данных из PDF с помощью машинного обучения.',
    category: 'office',
    icon: <Package className="extension-icon" />,
    rating: 4.7,
    downloads: '28K+',
    verified: true,
    installed: false,
    version: '3.0.1',
    tags: ['PDF', 'OCR', 'Data Extraction', 'AI']
  },
  {
    id: 'ai-document-assistant',
    name: 'AI Document Assistant',
    description: 'Универсальный ИИ-помощник для работы с любыми типами документов.',
    category: 'ai',
    icon: <Brain className="extension-icon" />,
    rating: 4.9,
    downloads: '75K+',
    verified: true,
    installed: true,
    version: '4.2.0',
    tags: ['AI', 'Assistant', 'Documents', 'Automation']
  },
  {
    id: 'smart-search-plus',
    name: 'Smart Search Plus',
    description: 'Расширенный поиск по содержимому документов с семантическим анализом.',
    category: 'productivity',
    icon: <Search className="extension-icon" />,
    rating: 4.5,
    downloads: '42K+',
    verified: false,
    installed: false,
    version: '1.6.3',
    tags: ['Search', 'Semantic', 'Content', 'Index']
  },
  {
    id: 'performance-booster',
    name: 'Performance Booster',
    description: 'Оптимизация производительности и ускорение обработки больших файлов.',
    category: 'productivity',
    icon: <Zap className="extension-icon" />,
    rating: 4.4,
    downloads: '22K+',
    verified: true,
    installed: false,
    version: '2.3.1',
    tags: ['Performance', 'Speed', 'Optimization', 'Memory']
  }
];

interface ExtensionMarketplaceProps {
  onClose: () => void;
}

export const ExtensionMarketplace: React.FC<ExtensionMarketplaceProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'Все расширения', count: extensions.length },
    { id: 'office', name: 'Офисные документы', count: extensions.filter(e => e.category === 'office').length },
    { id: 'ai', name: 'ИИ помощники', count: extensions.filter(e => e.category === 'ai').length },
    { id: 'productivity', name: 'Продуктивность', count: extensions.filter(e => e.category === 'productivity').length },
    { id: 'analysis', name: 'Анализ данных', count: extensions.filter(e => e.category === 'analysis').length }
  ];

  const filteredExtensions = extensions.filter(ext => {
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleInstall = (extensionId: string) => {
    // Логика установки расширения
    console.log('Installing extension:', extensionId);
  };

  const handleUninstall = (extensionId: string) => {
    // Логика удаления расширения
    console.log('Uninstalling extension:', extensionId);
  };

  return (
    <div className="extension-marketplace">
      <div className="marketplace-header">
        <div className="header-content">
          <h2 className="marketplace-title">
            <Package className="title-icon" />
            Маркетплейс расширений
          </h2>
          <p className="marketplace-subtitle">
            Расширьте возможности работы с документами
          </p>
        </div>
        <ModernButton 
          type="outline" 
          size="small" 
          onClick={onClose}
          className="close-btn"
        >
          ✕
        </ModernButton>
      </div>

      <div className="marketplace-controls">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Поиск расширений..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-filter">
          <Filter className="filter-icon" />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="extensions-grid">
        {filteredExtensions.map(extension => (
          <div key={extension.id} className={`extension-card ${extension.installed ? 'installed' : ''}`}>
            <div className="extension-header">
              <div className="extension-info">
                {extension.icon}
                <div className="extension-meta">
                  <h3 className="extension-name">
                    {extension.name}
                    {extension.verified && (
                      <span title="Проверено">
                        <Shield className="verified-badge" />
                      </span>
                    )}
                  </h3>
                  <div className="extension-stats">
                    <div className="rating">
                      <Star className="star-icon" />
                      <span>{extension.rating}</span>
                    </div>
                    <div className="downloads">
                      <Download className="download-icon" />
                      <span>{extension.downloads}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="extension-version">v{extension.version}</div>
            </div>

            <p className="extension-description">{extension.description}</p>

            <div className="extension-tags">
              {extension.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="extension-actions">
              {extension.installed ? (
                <div className="installed-controls">
                  <ModernButton 
                    type="outline" 
                    size="small"
                    onClick={() => handleUninstall(extension.id)}
                  >
                    Удалить
                  </ModernButton>
                  <span className="installed-badge">✓ Установлено</span>
                </div>
              ) : (
                <ModernButton 
                  type="primary" 
                  size="small"
                  onClick={() => handleInstall(extension.id)}
                  pulseAnimation={extension.rating > 4.7}
                >
                  <Download size={14} />
                  Установить
                </ModernButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredExtensions.length === 0 && (
        <div className="no-results">
          <Package className="no-results-icon" />
          <h3>Расширения не найдены</h3>
          <p>Попробуйте изменить критерии поиска или выбрать другую категорию</p>
        </div>
      )}
    </div>
  );
};

export default ExtensionMarketplace;
