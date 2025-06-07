import React, { useState, useCallback } from 'react';
import './SearchBar.css';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onFilterChange: (filterType: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    onFilterChange,
    placeholder = "Поиск файлов..."
}) => {
    const [query, setQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleFilterChange = (newFilter: string) => {
        setFilterType(newFilter);
        onFilterChange(newFilter);
        setIsFilterOpen(false);
    };

    const clearSearch = () => {
        setQuery('');
        onSearch('');
    };

    const filterOptions = [
        { value: 'all', label: 'Все файлы', icon: '📁' },
        { value: 'files', label: 'Только файлы', icon: '📄' },
        { value: 'folders', label: 'Только папки', icon: '📂' },
        { value: 'images', label: 'Изображения', icon: '🖼️' },
        { value: 'documents', label: 'Документы', icon: '📋' },
        { value: 'code', label: 'Код', icon: '💻' },
        { value: 'media', label: 'Медиа', icon: '🎬' },
    ];

    const getCurrentFilterLabel = () => {
        const currentFilter = filterOptions.find(option => option.value === filterType);
        return currentFilter ? `${currentFilter.icon} ${currentFilter.label}` : '📁 Все файлы';
    };

    return (
        <div className="search-bar">
            <div className="search-input-container">
                <div className="search-icon">🔍</div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={placeholder}
                    className="search-input"
                />
                {query && (
                    <button 
                        onClick={clearSearch}
                        className="search-clear"
                        title="Очистить поиск"
                    >
                        ×
                    </button>
                )}
            </div>
            
            <div className="search-filter">
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="filter-button"
                    title="Фильтр по типу файлов"
                >
                    {getCurrentFilterLabel()}
                    <span className={`filter-arrow ${isFilterOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                {isFilterOpen && (
                    <div className="filter-dropdown">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleFilterChange(option.value)}
                                className={`filter-option ${filterType === option.value ? 'active' : ''}`}
                            >
                                <span className="filter-icon">{option.icon}</span>
                                <span className="filter-label">{option.label}</span>
                                {filterType === option.value && (
                                    <span className="filter-check">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
