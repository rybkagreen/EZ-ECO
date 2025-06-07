import React, { useState, useEffect } from 'react';
import { archiveAPI } from '../../services/archiveAPI';

const ArchiveJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newJob, setNewJob] = useState({
        job_type: 'manual',
        source_paths: [],
        target_category: '',
        configuration: {}
    });

    const [filter, setFilter] = useState({
        status: 'all',
        job_type: 'all',
        date_from: '',
        date_to: ''
    });

    useEffect(() => {
        loadJobs();
        loadRules();
        loadCategories();
    }, []);

    useEffect(() => {
        loadJobs();
    }, [filter]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            if (filter.status !== 'all') params.append('status', filter.status);
            if (filter.job_type !== 'all') params.append('job_type', filter.job_type);
            if (filter.date_from) params.append('date_from', filter.date_from);
            if (filter.date_to) params.append('date_to', filter.date_to);

            const response = await archiveAPI.getArchivingJobs(params.toString());
            setJobs(response.data.results || response.data);
        } catch (err) {
            setError('Не удалось загрузить задания');
        } finally {
            setLoading(false);
        }
    };

    const loadRules = async () => {
        try {
            const response = await archiveAPI.getArchivingRules();
            setRules(response.data.results || response.data);
        } catch (err) {
            console.error('Не удалось загрузить правила:', err);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await archiveAPI.getCategories();
            setCategories(response.data.results || response.data);
        } catch (err) {
            console.error('Не удалось загрузить категории:', err);
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            const jobData = {
                ...newJob,
                source_paths: newJob.source_paths.filter(path => path.trim() !== '')
            };
            
            await archiveAPI.createArchivingJob(jobData);
            setNewJob({
                job_type: 'manual',
                source_paths: [],
                target_category: '',
                configuration: {}
            });
            setShowCreateForm(false);
            await loadJobs();
        } catch (err) {
            setError('Не удалось создать задание');
        }
    };

    const handleCancelJob = async (jobId) => {
        if (window.confirm('Вы уверены, что хотите отменить это задание?')) {
            try {
                await archiveAPI.cancelArchivingJob(jobId);
                await loadJobs();
            } catch (err) {
                setError('Не удалось отменить задание');
            }
        }
    };

    const handleExecuteRule = async (ruleId) => {
        try {
            await archiveAPI.executeArchivingRule(ruleId);
            await loadJobs();
        } catch (err) {
            setError('Не удалось выполнить правило');
        }
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: 'fas fa-clock',
            running: 'fas fa-spinner fa-spin',
            completed: 'fas fa-check',
            failed: 'fas fa-times',
            cancelled: 'fas fa-ban'
        };
        return icons[status] || 'fas fa-question';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Ожидает',
            running: 'Выполняется',
            completed: 'Завершено',
            failed: 'Ошибка',
            cancelled: 'Отменено'
        };
        return texts[status] || status;
    };

    const getJobTypeText = (type) => {
        const texts = {
            manual: 'Ручное',
            scheduled: 'По расписанию',
            auto_rule: 'Автоправило',
            bulk_import: 'Массовый импорт'
        };
        return texts[type] || type;
    };

    const addSourcePath = () => {
        setNewJob({
            ...newJob,
            source_paths: [...newJob.source_paths, '']
        });
    };

    const updateSourcePath = (index, value) => {
        const updatedPaths = [...newJob.source_paths];
        updatedPaths[index] = value;
        setNewJob({
            ...newJob,
            source_paths: updatedPaths
        });
    };

    const removeSourcePath = (index) => {
        const updatedPaths = newJob.source_paths.filter((_, i) => i !== index);
        setNewJob({
            ...newJob,
            source_paths: updatedPaths
        });
    };

    if (loading) {
        return (
            <div className="archive-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка заданий...</p>
            </div>
        );
    }

    return (
        <div className="archive-jobs">
            <div className="jobs-header">
                <h2>Задания архивирования</h2>
                <div className="header-actions">
                    <button 
                        className="btn-primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <i className="fas fa-plus"></i>
                        Создать задание
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            {/* Фильтры */}
            <div className="jobs-filters">
                <div className="filter-group">
                    <label>Статус:</label>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({...filter, status: e.target.value})}
                    >
                        <option value="all">Все</option>
                        <option value="pending">Ожидает</option>
                        <option value="running">Выполняется</option>
                        <option value="completed">Завершено</option>
                        <option value="failed">Ошибка</option>
                        <option value="cancelled">Отменено</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Тип:</label>
                    <select
                        value={filter.job_type}
                        onChange={(e) => setFilter({...filter, job_type: e.target.value})}
                    >
                        <option value="all">Все</option>
                        <option value="manual">Ручное</option>
                        <option value="scheduled">По расписанию</option>
                        <option value="auto_rule">Автоправило</option>
                        <option value="bulk_import">Массовый импорт</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>От:</label>
                    <input
                        type="date"
                        value={filter.date_from}
                        onChange={(e) => setFilter({...filter, date_from: e.target.value})}
                    />
                </div>

                <div className="filter-group">
                    <label>До:</label>
                    <input
                        type="date"
                        value={filter.date_to}
                        onChange={(e) => setFilter({...filter, date_to: e.target.value})}
                    />
                </div>
            </div>

            {/* Автоматические правила */}
            <div className="auto-rules-section">
                <h3>Правила автоархивирования</h3>
                <div className="rules-list">
                    {rules.map(rule => (
                        <div key={rule.id} className="rule-card">
                            <div className="rule-header">
                                <h4>{rule.name}</h4>
                                <div className="rule-actions">
                                    <span className={`status-badge ${rule.status}`}>
                                        {rule.status === 'active' ? 'Активно' : 'Неактивно'}
                                    </span>
                                    {rule.status === 'active' && (
                                        <button 
                                            className="btn-secondary"
                                            onClick={() => handleExecuteRule(rule.id)}
                                        >
                                            <i className="fas fa-play"></i>
                                            Выполнить
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p>{rule.description}</p>
                            <div className="rule-stats">
                                <span>Успешно: {rule.success_count}</span>
                                <span>Ошибок: {rule.error_count}</span>
                                {rule.last_run && (
                                    <span>Последний запуск: {new Date(rule.last_run).toLocaleString()}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Список заданий */}
            <div className="jobs-list">
                {jobs.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-tasks"></i>
                        <h3>Нет заданий</h3>
                        <p>Создайте первое задание архивирования</p>
                    </div>
                ) : (
                    jobs.map(job => (
                        <div 
                            key={job.id} 
                            className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                            onClick={() => setSelectedJob(job)}
                        >
                            <div className="job-header">
                                <div className="job-title">
                                    <i className={getStatusIcon(job.status)}></i>
                                    <span>Задание #{job.id.slice(0, 8)}</span>
                                </div>
                                <div className="job-meta">
                                    <span className={`status-badge ${job.status}`}>
                                        {getStatusText(job.status)}
                                    </span>
                                    <span className="job-type">
                                        {getJobTypeText(job.job_type)}
                                    </span>
                                </div>
                            </div>

                            <div className="job-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${job.progress_percentage || 0}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">
                                    {job.processed_files}/{job.total_files} файлов
                                    ({Math.round(job.progress_percentage || 0)}%)
                                </div>
                            </div>

                            <div className="job-details">
                                <div className="detail-item">
                                    <span>Создано:</span>
                                    <span>{new Date(job.created_at).toLocaleString()}</span>
                                </div>
                                {job.started_at && (
                                    <div className="detail-item">
                                        <span>Запущено:</span>
                                        <span>{new Date(job.started_at).toLocaleString()}</span>
                                    </div>
                                )}
                                {job.completed_at && (
                                    <div className="detail-item">
                                        <span>Завершено:</span>
                                        <span>{new Date(job.completed_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="job-stats">
                                <div className="stat-item success">
                                    <i className="fas fa-check"></i>
                                    <span>{job.successful_files}</span>
                                </div>
                                <div className="stat-item error">
                                    <i className="fas fa-times"></i>
                                    <span>{job.failed_files}</span>
                                </div>
                            </div>

                            {(job.status === 'pending' || job.status === 'running') && (
                                <div className="job-actions">
                                    <button 
                                        className="btn-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelJob(job.id);
                                        }}
                                    >
                                        <i className="fas fa-stop"></i>
                                        Отменить
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Детали задания */}
            {selectedJob && (
                <div className="job-details-panel">
                    <div className="details-header">
                        <h3>Детали задания #{selectedJob.id.slice(0, 8)}</h3>
                        <button 
                            className="btn-icon"
                            onClick={() => setSelectedJob(null)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className="details-content">
                        <div className="detail-section">
                            <h4>Исходные пути:</h4>
                            <ul>
                                {selectedJob.source_paths.map((path, index) => (
                                    <li key={index}>{path}</li>
                                ))}
                            </ul>
                        </div>
                        
                        {selectedJob.error_log && selectedJob.error_log.length > 0 && (
                            <div className="detail-section">
                                <h4>Журнал ошибок:</h4>
                                <div className="error-log">
                                    {selectedJob.error_log.map((error, index) => (
                                        <div key={index} className="error-entry">
                                            {error.message || error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {selectedJob.results && Object.keys(selectedJob.results).length > 0 && (
                            <div className="detail-section">
                                <h4>Результаты:</h4>
                                <pre>{JSON.stringify(selectedJob.results, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Модальное окно создания задания */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Создать новое задание</h3>
                            <button 
                                className="btn-icon"
                                onClick={() => setShowCreateForm(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateJob} className="job-form">
                            <div className="form-group">
                                <label>Тип задания</label>
                                <select
                                    value={newJob.job_type}
                                    onChange={(e) => setNewJob({...newJob, job_type: e.target.value})}
                                >
                                    <option value="manual">Ручное</option>
                                    <option value="bulk_import">Массовый импорт</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Целевая категория *</label>
                                <select
                                    value={newJob.target_category}
                                    onChange={(e) => setNewJob({...newJob, target_category: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите категорию</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.full_path || cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Исходные пути</label>
                                {newJob.source_paths.map((path, index) => (
                                    <div key={index} className="path-input">
                                        <input
                                            type="text"
                                            value={path}
                                            onChange={(e) => updateSourcePath(index, e.target.value)}
                                            placeholder="Введите путь к файлу или папке"
                                        />
                                        <button 
                                            type="button"
                                            className="btn-icon danger"
                                            onClick={() => removeSourcePath(index)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={addSourcePath}
                                >
                                    <i className="fas fa-plus"></i>
                                    Добавить путь
                                </button>
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowCreateForm(false)}>
                                    Отмена
                                </button>
                                <button type="submit" className="btn-primary">
                                    Создать задание
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchiveJobs;
