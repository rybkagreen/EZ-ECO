import React, { useState, useCallback } from 'react';
import { ChevronRight, Home, Folder, Search, Filter, RefreshCw } from 'lucide-react';
import './BreadcrumbNavigation.css';

interface PathSegment {
    name: string;
    path: string;
    isDirectory: boolean;
}

interface BreadcrumbNavigationProps {
    currentPath: string;
    onNavigate?: (path: string) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    showSearch?: boolean;
    onSearch?: (query: string) => void;
    searchQuery?: string;
    pathSeparator?: string;
    maxDisplayLength?: number;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
    currentPath = '/',
    onNavigate,
    onRefresh,
    isLoading = false,
    showSearch = true,
    onSearch,
    searchQuery = '',
    pathSeparator = '/',
    maxDisplayLength = 50
}) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Разбиваем путь на сегменты
    const getPathSegments = useCallback((): PathSegment[] => {
        if (!currentPath || currentPath === pathSeparator) {
            return [{ name: 'Home', path: pathSeparator, isDirectory: true }];
        }

        const segments: PathSegment[] = [
            { name: 'Home', path: pathSeparator, isDirectory: true }
        ];

        const pathParts = currentPath
            .split(pathSeparator)
            .filter(part => part.length > 0);

        let buildPath = '';
        pathParts.forEach(part => {
            buildPath += pathSeparator + part;
            segments.push({
                name: part,
                path: buildPath,
                isDirectory: true
            });
        });

        return segments;
    }, [currentPath, pathSeparator]);

    // Сокращение длинных имен
    const truncateName = useCallback((name: string, maxLength: number = 20): string => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength - 3) + '...';
    }, []);

    // Сокращение пути если он слишком длинный
    const getDisplaySegments = useCallback((): PathSegment[] => {
        const segments = getPathSegments();
        
        if (segments.length <= 3) return segments;

        const totalLength = segments.reduce((acc, seg) => acc + seg.name.length, 0);
        
        if (totalLength <= maxDisplayLength) return segments;

        // Показываем Home, ..., предпоследний, последний
        return [
            segments[0], // Home
            { name: '...', path: '', isDirectory: true }, // Ellipsis
            ...segments.slice(-2) // Последние 2 сегмента
        ];
    }, [getPathSegments, maxDisplayLength]);

    // Обработка навигации
    const handleNavigate = useCallback((path: string) => {
        if (path && onNavigate) {
            onNavigate(path);
        }
    }, [onNavigate]);

    // Обработка поиска
    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch && localSearchQuery.trim()) {
            onSearch(localSearchQuery.trim());
        }
    }, [onSearch, localSearchQuery]);

    // Обработка активации поиска
    const handleSearchActivate = useCallback(() => {
        setIsSearchActive(true);
    }, []);

    // Обработка деактивации поиска
    const handleSearchDeactivate = useCallback(() => {
        setIsSearchActive(false);
        setLocalSearchQuery('');
        if (onSearch) {
            onSearch('');
        }
    }, [onSearch]);

    // Обработка изменения поискового запроса
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearchQuery(e.target.value);
    }, []);

    const displaySegments = getDisplaySegments();

    return (
        <div className="breadcrumb-navigation">
            <div className="breadcrumb-wrapper">
                <nav className="breadcrumb-nav" aria-label="File path navigation">
                    <ol className="breadcrumb-list">
                        {displaySegments.map((segment, index) => (
                            <li key={segment.path || index} className="breadcrumb-item">
                                {index > 0 && (
                                    <ChevronRight 
                                        size={14} 
                                        className="breadcrumb-separator"
                                        aria-hidden="true"
                                    />
                                )}
                                
                                {segment.name === '...' ? (
                                    <span className="breadcrumb-ellipsis" title="Скрытые сегменты пути">
                                        {segment.name}
                                    </span>
                                ) : (
                                    <button
                                        className={`breadcrumb-link ${index === displaySegments.length - 1 ? 'current' : ''}`}
                                        onClick={() => handleNavigate(segment.path)}
                                        disabled={index === displaySegments.length - 1}
                                        title={`Перейти к ${segment.name}`}
                                        aria-current={index === displaySegments.length - 1 ? 'page' : undefined}
                                    >
                                        {index === 0 ? (
                                            <Home size={16} aria-label="Домашняя папка" />
                                        ) : (
                                            <Folder size={16} aria-hidden="true" />
                                        )}
                                        <span className="breadcrumb-text">
                                            {truncateName(segment.name)}
                                        </span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="breadcrumb-actions">
                    {showSearch && (
                        <div className={`search-container ${isSearchActive ? 'active' : ''}`}>
                            {!isSearchActive ? (
                                <button
                                    className="search-trigger"
                                    onClick={handleSearchActivate}
                                    title="Поиск в текущей папке"
                                    aria-label="Открыть поиск"
                                >
                                    <Search size={16} />
                                </button>
                            ) : (
                                <form className="search-form" onSubmit={handleSearchSubmit}>
                                    <div className="search-input-wrapper">
                                        <Search size={16} className="search-icon" />
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Поиск файлов..."
                                            value={localSearchQuery}
                                            onChange={handleSearchChange}
                                            autoFocus
                                            aria-label="Поиск файлов в текущей папке"
                                        />
                                        <button
                                            type="button"
                                            className="search-close"
                                            onClick={handleSearchDeactivate}
                                            title="Закрыть поиск"
                                            aria-label="Закрыть поиск"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    <button
                        className={`refresh-button ${isLoading ? 'loading' : ''}`}
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Обновить содержимое папки"
                        aria-label="Обновить список файлов"
                    >
                        <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            {searchQuery && (
                <div className="search-info">
                    <span className="search-query">
                        Поиск: "<strong>{searchQuery}</strong>"
                    </span>
                    <button
                        className="clear-search"
                        onClick={() => onSearch?.('')}
                        title="Очистить поиск"
                        aria-label="Очистить поиск"
                    >
                        Очистить
                    </button>
                </div>
            )}
        </div>
    );
};

export default BreadcrumbNavigation;
