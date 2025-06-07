import React, { useState, useEffect, useCallback } from 'react';
import { archiveAPI } from '../../services/archiveAPI';
import { debounce } from '../../utils/debounce';

const ArchiveSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    accessLevel: '',
    fileType: ''
  });
  const [categories, setCategories] = useState([]);
  const [searchMode, setSearchMode] = useState('semantic'); // semantic, simple, advanced

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await archiveAPI.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Семантический поиск с дебаунсом
  const debouncedSemanticSearch = useCallback(
    debounce(async (query) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await archiveAPI.semanticSearch(query, searchFilters);
        setSearchResults(results);
      } catch (error) {
        console.error('Semantic search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [searchFilters]
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchMode === 'semantic') {
      debouncedSemanticSearch(query);
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let results;
      if (searchMode === 'semantic') {
        results = await archiveAPI.semanticSearch(searchQuery, searchFilters);
      } else {
        results = await archiveAPI.simpleSearch(searchQuery, searchFilters);
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      category: '',
      dateFrom: '',
      dateTo: '',
      accessLevel: '',
      fileType: ''
    });
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="archive-search">
      <h2 className="dashboard-title">Интеллектуальный поиск</h2>
      
      {/* Режимы поиска */}
      <div className="search-modes">
        <button 
          className={`archive-btn ${searchMode === 'semantic' ? 'primary' : ''}`}
          onClick={() => setSearchMode('semantic')}
        >
          🤖 Семантический поиск
        </button>
        <button 
          className={`archive-btn ${searchMode === 'simple' ? 'primary' : ''}`}
          onClick={() => setSearchMode('simple')}
        >
          🔍 Простой поиск
        </button>
        <button 
          className={`archive-btn ${searchMode === 'advanced' ? 'primary' : ''}`}
          onClick={() => setSearchMode('advanced')}
        >
          ⚙️ Расширенный поиск
        </button>
      </div>

      {/* Поисковая строка */}
      <div className="archive-search-container">
        <div className="archive-search-icon">🔍</div>
        <input
          type="text"
          className="archive-search-input"
          placeholder={
            searchMode === 'semantic' 
              ? "Опишите, что вы ищете естественным языком..."
              : "Введите ключевые слова для поиска..."
          }
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
        />
        <button 
          className="search-button archive-btn primary"
          onClick={handleManualSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {/* Подсказки для семантического поиска */}
      {searchMode === 'semantic' && (
        <div className="search-hints">
          <p>💡 Примеры запросов:</p>
          <div className="hint-tags">
            <span className="hint-tag" onClick={() => setSearchQuery('договоры с поставщиками')}>
              договоры с поставщиками
            </span>
            <span className="hint-tag" onClick={() => setSearchQuery('финансовые отчеты за прошлый год')}>
              финансовые отчеты за прошлый год
            </span>
            <span className="hint-tag" onClick={() => setSearchQuery('документы содержащие персональные данные')}>
              документы с персональными данными
            </span>
          </div>
        </div>
      )}

      {/* Фильтры поиска */}
      <div className="archive-card">
        <div className="archive-card-header">
          <h3 className="archive-card-title">Фильтры поиска</h3>
          <button className="archive-btn" onClick={clearFilters}>
            Очистить фильтры
          </button>
        </div>
        <div className="search-filters">
          <div className="filter-group">
            <label>Категория:</label>
            <select 
              className="archive-input"
              value={searchFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Дата архивирования от:</label>
            <input 
              type="date"
              className="archive-input"
              value={searchFilters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>До:</label>
            <input 
              type="date"
              className="archive-input"
              value={searchFilters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Уровень доступа:</label>
            <select 
              className="archive-input"
              value={searchFilters.accessLevel}
              onChange={(e) => handleFilterChange('accessLevel', e.target.value)}
            >
              <option value="">Любой</option>
              <option value="public">Публичный</option>
              <option value="internal">Внутренний</option>
              <option value="confidential">Конфиденциальный</option>
              <option value="restricted">Ограниченный</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Тип файла:</label>
            <select 
              className="archive-input"
              value={searchFilters.fileType}
              onChange={(e) => handleFilterChange('fileType', e.target.value)}
            >
              <option value="">Все типы</option>
              <option value="pdf">PDF</option>
              <option value="doc">Word</option>
              <option value="excel">Excel</option>
              <option value="image">Изображения</option>
              <option value="text">Текстовые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Результаты поиска */}
      <div className="search-results">
        {isSearching && (
          <div className="archive-loading">
            <div className="archive-spinner"></div>
            {searchMode === 'semantic' ? 'ИИ анализирует запрос...' : 'Поиск...'}
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <>
            <div className="results-header">
              <h3>Найдено результатов: {searchResults.length}</h3>
              {searchMode === 'semantic' && (
                <p className="semantic-note">
                  🤖 Результаты отсортированы по семантической релевантности
                </p>
              )}
            </div>
            
            <div className="results-list">
              {searchResults.map((result, index) => (
                <div key={index} className="result-item archive-card">
                  <div className="result-header">
                    <h4 className="result-title">
                      {result.document?.original_file?.name || 'Документ'}
                    </h4>
                    <div className="result-meta">
                      {searchMode === 'semantic' && (
                        <span className="similarity-score">
                          Релевантность: {Math.round((result.similarity || 0) * 100)}%
                        </span>
                      )}
                      <span className="result-category">
                        {result.document?.category?.name}
                      </span>
                      <span className="result-date">
                        {new Date(result.document?.archived_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="result-content">
                    {result.summary && (
                      <p className="result-summary"
                         dangerouslySetInnerHTML={{ 
                           __html: highlightText(result.summary, searchQuery) 
                         }}
                      />
                    )}
                    
                    {result.keywords && result.keywords.length > 0 && (
                      <div className="result-keywords">
                        <strong>Ключевые слова:</strong>
                        {result.keywords.map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">{keyword}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="result-actions">
                    <button className="archive-btn">Просмотреть</button>
                    <button className="archive-btn">Скачать</button>
                    <button className="archive-btn">Метаданные</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!isSearching && searchQuery && searchResults.length === 0 && (
          <div className="no-results">
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или настроить фильтры</p>
            {searchMode === 'semantic' && (
              <p>
                💡 Для семантического поиска используйте естественные фразы: 
                "документы о закупках", "отчеты по продажам" и т.д.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveSearch;
