import React, { useState, useEffect } from 'react';
import { archiveAPI } from '../../services/archiveAPI';

const ArchiveSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Настройки общих параметров
    const [generalSettings, setGeneralSettings] = useState({
        auto_archiving_enabled: true,
        default_retention_days: 365,
        max_file_size: 100, // MB
        allowed_file_types: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
        require_approval: false,
        email_notifications: true
    });

    // Политики хранения
    const [retentionPolicies, setRetentionPolicies] = useState([]);
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        description: '',
        default_retention_days: 365,
        max_retention_days: 3650,
        auto_delete_expired: false
    });

    // Правила соответствия
    const [complianceRules, setComplianceRules] = useState([]);
    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        rule_type: 'retention',
        rule_config: {},
        severity: 'medium',
        is_active: true
    });

    useEffect(() => {
        loadRetentionPolicies();
        loadComplianceRules();
    }, []);

    const loadRetentionPolicies = async () => {
        try {
            const response = await archiveAPI.getRetentionPolicies();
            setRetentionPolicies(response.data.results || response.data);
        } catch (err) {
            setError('Не удалось загрузить политики хранения');
        }
    };

    const loadComplianceRules = async () => {
        try {
            const response = await archiveAPI.getComplianceRules();
            setComplianceRules(response.data.results || response.data);
        } catch (err) {
            setError('Не удалось загрузить правила соответствия');
        }
    };

    const handleSaveGeneralSettings = async () => {
        try {
            setLoading(true);
            // Здесь будет API для сохранения общих настроек
            setSuccess('Настройки сохранены успешно');
        } catch (err) {
            setError('Не удалось сохранить настройки');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRetentionPolicy = async (e) => {
        e.preventDefault();
        try {
            await archiveAPI.createRetentionPolicy(newPolicy);
            setNewPolicy({
                name: '',
                description: '',
                default_retention_days: 365,
                max_retention_days: 3650,
                auto_delete_expired: false
            });
            await loadRetentionPolicies();
            setSuccess('Политика хранения создана');
        } catch (err) {
            setError('Не удалось создать политику хранения');
        }
    };

    const handleCreateComplianceRule = async (e) => {
        e.preventDefault();
        try {
            await archiveAPI.createComplianceRule(newRule);
            setNewRule({
                name: '',
                description: '',
                rule_type: 'retention',
                rule_config: {},
                severity: 'medium',
                is_active: true
            });
            await loadComplianceRules();
            setSuccess('Правило соответствия создано');
        } catch (err) {
            setError('Не удалось создать правило соответствия');
        }
    };

    const handleDeleteRetentionPolicy = async (policyId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту политику?')) {
            try {
                await archiveAPI.deleteRetentionPolicy(policyId);
                await loadRetentionPolicies();
                setSuccess('Политика удалена');
            } catch (err) {
                setError('Не удалось удалить политику');
            }
        }
    };

    const handleDeleteComplianceRule = async (ruleId) => {
        if (window.confirm('Вы уверены, что хотите удалить это правило?')) {
            try {
                await archiveAPI.deleteComplianceRule(ruleId);
                await loadComplianceRules();
                setSuccess('Правило удалено');
            } catch (err) {
                setError('Не удалось удалить правило');
            }
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const renderGeneralSettings = () => (
        <div className="settings-section">
            <h3>Общие настройки</h3>
            
            <div className="settings-form">
                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={generalSettings.auto_archiving_enabled}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                auto_archiving_enabled: e.target.checked
                            })}
                        />
                        <span className="checkmark"></span>
                        Включить автоматическое архивирование
                    </label>
                </div>

                <div className="form-group">
                    <label>Срок хранения по умолчанию (дни)</label>
                    <input
                        type="number"
                        value={generalSettings.default_retention_days}
                        onChange={(e) => setGeneralSettings({
                            ...generalSettings,
                            default_retention_days: parseInt(e.target.value)
                        })}
                        min="1"
                        max="3650"
                    />
                </div>

                <div className="form-group">
                    <label>Максимальный размер файла (МБ)</label>
                    <input
                        type="number"
                        value={generalSettings.max_file_size}
                        onChange={(e) => setGeneralSettings({
                            ...generalSettings,
                            max_file_size: parseInt(e.target.value)
                        })}
                        min="1"
                        max="1024"
                    />
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={generalSettings.require_approval}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                require_approval: e.target.checked
                            })}
                        />
                        <span className="checkmark"></span>
                        Требовать одобрение для архивирования
                    </label>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={generalSettings.email_notifications}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                email_notifications: e.target.checked
                            })}
                        />
                        <span className="checkmark"></span>
                        Email уведомления
                    </label>
                </div>

                <button 
                    className="btn-primary"
                    onClick={handleSaveGeneralSettings}
                    disabled={loading}
                >
                    {loading ? 'Сохранение...' : 'Сохранить настройки'}
                </button>
            </div>
        </div>
    );

    const renderRetentionPolicies = () => (
        <div className="settings-section">
            <h3>Политики хранения</h3>
            
            <div className="policies-list">
                {retentionPolicies.map(policy => (
                    <div key={policy.id} className="policy-card">
                        <div className="policy-header">
                            <h4>{policy.name}</h4>
                            <button 
                                className="btn-icon danger"
                                onClick={() => handleDeleteRetentionPolicy(policy.id)}
                                title="Удалить политику"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                        <p>{policy.description}</p>
                        <div className="policy-details">
                            <span>По умолчанию: {policy.default_retention_days} дней</span>
                            <span>Максимум: {policy.max_retention_days} дней</span>
                            {policy.auto_delete_expired && (
                                <span className="auto-delete">
                                    <i className="fas fa-trash-alt"></i>
                                    Автоудаление
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="create-policy-form">
                <h4>Создать новую политику</h4>
                <form onSubmit={handleCreateRetentionPolicy}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Название политики"
                            value={newPolicy.name}
                            onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            placeholder="Описание политики"
                            value={newPolicy.description}
                            onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})}
                            rows="2"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Срок по умолчанию (дни)</label>
                            <input
                                type="number"
                                value={newPolicy.default_retention_days}
                                onChange={(e) => setNewPolicy({...newPolicy, default_retention_days: parseInt(e.target.value)})}
                                min="1"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Максимальный срок (дни)</label>
                            <input
                                type="number"
                                value={newPolicy.max_retention_days}
                                onChange={(e) => setNewPolicy({...newPolicy, max_retention_days: parseInt(e.target.value)})}
                                min="1"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={newPolicy.auto_delete_expired}
                                onChange={(e) => setNewPolicy({...newPolicy, auto_delete_expired: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            Автоматически удалять просроченные документы
                        </label>
                    </div>
                    <button type="submit" className="btn-primary">
                        Создать политику
                    </button>
                </form>
            </div>
        </div>
    );

    const renderComplianceRules = () => (
        <div className="settings-section">
            <h3>Правила соответствия</h3>
            
            <div className="rules-list">
                {complianceRules.map(rule => (
                    <div key={rule.id} className="rule-card">
                        <div className="rule-header">
                            <h4>{rule.name}</h4>
                            <div className="rule-actions">
                                <span className={`severity-badge ${rule.severity}`}>
                                    {rule.severity}
                                </span>
                                <span className={`status-badge ${rule.is_active ? 'active' : 'inactive'}`}>
                                    {rule.is_active ? 'Активно' : 'Неактивно'}
                                </span>
                                <button 
                                    className="btn-icon danger"
                                    onClick={() => handleDeleteComplianceRule(rule.id)}
                                    title="Удалить правило"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p>{rule.description}</p>
                        <div className="rule-details">
                            <span>Тип: {rule.rule_type}</span>
                            {rule.last_check && (
                                <span>Последняя проверка: {new Date(rule.last_check).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="create-rule-form">
                <h4>Создать новое правило</h4>
                <form onSubmit={handleCreateComplianceRule}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Название правила"
                            value={newRule.name}
                            onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            placeholder="Описание правила"
                            value={newRule.description}
                            onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                            rows="2"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Тип правила</label>
                            <select
                                value={newRule.rule_type}
                                onChange={(e) => setNewRule({...newRule, rule_type: e.target.value})}
                            >
                                <option value="retention">Хранение</option>
                                <option value="access_control">Контроль доступа</option>
                                <option value="data_classification">Классификация данных</option>
                                <option value="audit_trail">Аудиторский след</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Важность</label>
                            <select
                                value={newRule.severity}
                                onChange={(e) => setNewRule({...newRule, severity: e.target.value})}
                            >
                                <option value="low">Низкая</option>
                                <option value="medium">Средняя</option>
                                <option value="high">Высокая</option>
                                <option value="critical">Критичная</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={newRule.is_active}
                                onChange={(e) => setNewRule({...newRule, is_active: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            Активировать правило
                        </label>
                    </div>
                    <button type="submit" className="btn-primary">
                        Создать правило
                    </button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="archive-settings">
            <div className="settings-header">
                <h2>Настройки архива</h2>
            </div>

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {error}
                    <button onClick={clearMessages} className="btn-icon">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            {success && (
                <div className="success-message">
                    <i className="fas fa-check-circle"></i>
                    {success}
                    <button onClick={clearMessages} className="btn-icon">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className="settings-tabs">
                <button 
                    className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <i className="fas fa-cog"></i>
                    Общие
                </button>
                <button 
                    className={`tab-button ${activeTab === 'retention' ? 'active' : ''}`}
                    onClick={() => setActiveTab('retention')}
                >
                    <i className="fas fa-calendar-alt"></i>
                    Политики хранения
                </button>
                <button 
                    className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compliance')}
                >
                    <i className="fas fa-shield-alt"></i>
                    Соответствие
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'general' && renderGeneralSettings()}
                {activeTab === 'retention' && renderRetentionPolicies()}
                {activeTab === 'compliance' && renderComplianceRules()}
            </div>
        </div>
    );
};

export default ArchiveSettings;
