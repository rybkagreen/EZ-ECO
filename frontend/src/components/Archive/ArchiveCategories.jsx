import React, { useState, useEffect } from 'react';
import { archiveAPI } from '../../services/archiveAPI';

const ArchiveCategories = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        parent: null,
        default_access_level: 'internal',
        requires_approval: false,
        auto_categorize: true
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await archiveAPI.getCategories();
            setCategories(response.data.results || response.data);
        } catch (err) {
            setError('Не удалось загрузить категории');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await archiveAPI.createCategory(newCategory);
            setNewCategory({
                name: '',
                description: '',
                parent: null,
                default_access_level: 'internal',
                requires_approval: false,
                auto_categorize: true
            });
            setShowCreateForm(false);
            await loadCategories();
        } catch (err) {
            setError('Не удалось создать категорию');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
            try {
                await archiveAPI.deleteCategory(categoryId);
                await loadCategories();
            } catch (err) {
                setError('Не удалось удалить категорию');
            }
        }
    };

    const getCategoryTree = (categories, parentId = null) => {
        return categories
            .filter(cat => cat.parent === parentId)
            .map(category => ({
                ...category,
                children: getCategoryTree(categories, category.id)
            }));
    };

    const renderCategoryTree = (categoryTree, level = 0) => {
        return categoryTree.map(category => (
            <div key={category.id} className="category-tree-item" style={{ marginLeft: `${level * 20}px` }}>
                <div className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}>
                    <div className="category-header" onClick={() => setSelectedCategory(category)}>
                        <div className="category-icon">
                            <i className="fas fa-folder"></i>
                        </div>
                        <div className="category-info">
                            <h4>{category.name}</h4>
                            <p>{category.description}</p>
                            <div className="category-meta">
                                <span className="documents-count">
                                    <i className="fas fa-file"></i>
                                    {category.documents_count} документов
                                </span>
                                <span className={`access-level ${category.default_access_level}`}>
                                    {category.default_access_level}
                                </span>
                                {category.requires_approval && (
                                    <span className="requires-approval">
                                        <i className="fas fa-check-circle"></i>
                                        Требует одобрения
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="category-actions">
                            <button 
                                className="btn-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(category);
                                }}
                                title="Редактировать"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            <button 
                                className="btn-icon danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                }}
                                title="Удалить"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                {category.children && category.children.length > 0 && (
                    <div className="category-children">
                        {renderCategoryTree(category.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="archive-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка категорий...</p>
            </div>
        );
    }

    const categoryTree = getCategoryTree(categories);

    return (
        <div className="archive-categories">
            <div className="categories-header">
                <h2>Категории архива</h2>
                <button 
                    className="btn-primary"
                    onClick={() => setShowCreateForm(true)}
                >
                    <i className="fas fa-plus"></i>
                    Создать категорию
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            <div className="categories-content">
                <div className="categories-tree">
                    {categoryTree.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-folder-open"></i>
                            <h3>Нет категорий</h3>
                            <p>Создайте первую категорию для организации архива</p>
                        </div>
                    ) : (
                        renderCategoryTree(categoryTree)
                    )}
                </div>

                {selectedCategory && (
                    <div className="category-details">
                        <div className="details-header">
                            <h3>{selectedCategory.name}</h3>
                            <button 
                                className="btn-icon"
                                onClick={() => setSelectedCategory(null)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="details-content">
                            <div className="detail-section">
                                <label>Описание:</label>
                                <p>{selectedCategory.description || 'Нет описания'}</p>
                            </div>
                            
                            <div className="detail-section">
                                <label>Уровень доступа по умолчанию:</label>
                                <span className={`access-badge ${selectedCategory.default_access_level}`}>
                                    {selectedCategory.default_access_level}
                                </span>
                            </div>
                            
                            <div className="detail-section">
                                <label>Статистика:</label>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-value">{selectedCategory.documents_count}</span>
                                        <span className="stat-label">Документов</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="detail-section">
                                <label>Настройки:</label>
                                <div className="settings-list">
                                    <div className="setting-item">
                                        <i className={`fas ${selectedCategory.requires_approval ? 'fa-check' : 'fa-times'}`}></i>
                                        Требует одобрения
                                    </div>
                                    <div className="setting-item">
                                        <i className={`fas ${selectedCategory.auto_categorize ? 'fa-check' : 'fa-times'}`}></i>
                                        Автокатегоризация
                                    </div>
                                    <div className="setting-item">
                                        <i className={`fas ${selectedCategory.is_active ? 'fa-check' : 'fa-times'}`}></i>
                                        Активна
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Модальное окно создания категории */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Создать новую категорию</h3>
                            <button 
                                className="btn-icon"
                                onClick={() => setShowCreateForm(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateCategory} className="category-form">
                            <div className="form-group">
                                <label>Название категории *</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                    required
                                    placeholder="Введите название категории"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                    placeholder="Опишите назначение категории"
                                    rows="3"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Родительская категория</label>
                                <select
                                    value={newCategory.parent || ''}
                                    onChange={(e) => setNewCategory({...newCategory, parent: e.target.value || null})}
                                >
                                    <option value="">Корневая категория</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.full_path || cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Уровень доступа по умолчанию</label>
                                <select
                                    value={newCategory.default_access_level}
                                    onChange={(e) => setNewCategory({...newCategory, default_access_level: e.target.value})}
                                >
                                    <option value="public">Публичный</option>
                                    <option value="internal">Внутренний</option>
                                    <option value="confidential">Конфиденциальный</option>
                                    <option value="restricted">Ограниченный</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newCategory.requires_approval}
                                        onChange={(e) => setNewCategory({...newCategory, requires_approval: e.target.checked})}
                                    />
                                    <span className="checkmark"></span>
                                    Требует одобрения для архивирования
                                </label>
                            </div>
                            
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newCategory.auto_categorize}
                                        onChange={(e) => setNewCategory({...newCategory, auto_categorize: e.target.checked})}
                                    />
                                    <span className="checkmark"></span>
                                    Включить автокатегоризацию
                                </label>
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowCreateForm(false)}>
                                    Отмена
                                </button>
                                <button type="submit" className="btn-primary">
                                    Создать категорию
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchiveCategories;
