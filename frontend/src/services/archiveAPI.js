const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ArchiveAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/archive`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Добавить токен авторизации если есть
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Archive API request failed:', error);
      throw error;
    }
  }

  // ========== СТАТИСТИКА И ДАШБОРД ==========

  async getStats() {
    return this.request('/stats/');
  }

  async getRecentActivity(limit = 10) {
    return this.request(`/activity/?limit=${limit}`);
  }

  async getDashboardData() {
    return this.request('/dashboard/');
  }

  // ========== ПОИСК ==========

  async semanticSearch(query, filters = {}) {
    const params = new URLSearchParams({
      q: query,
      mode: 'semantic',
      ...filters
    });
    
    return this.request(`/search/?${params}`);
  }

  async simpleSearch(query, filters = {}) {
    const params = new URLSearchParams({
      q: query,
      mode: 'simple',
      ...filters
    });
    
    return this.request(`/search/?${params}`);
  }

  async advancedSearch(criteria) {
    return this.request('/search/advanced/', {
      method: 'POST',
      body: JSON.stringify(criteria)
    });
  }

  // ========== ДОКУМЕНТЫ ==========

  async getDocuments(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/documents/?${queryParams}`);
  }

  async getDocument(documentId) {
    return this.request(`/documents/${documentId}/`);
  }

  async archiveDocument(fileId, categoryId, metadata = {}) {
    return this.request('/documents/', {
      method: 'POST',
      body: JSON.stringify({
        file_id: fileId,
        category_id: categoryId,
        metadata: metadata
      })
    });
  }

  async updateDocument(documentId, data) {
    return this.request(`/documents/${documentId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateDocumentMetadata(documentId, metadata) {
    return this.request(`/documents/${documentId}/update_metadata/`, {
      method: 'POST',
      body: JSON.stringify({ metadata })
    });
  }

  async deleteDocument(documentId) {
    return this.request(`/documents/${documentId}/`, {
      method: 'DELETE'
    });
  }

  async restoreDocument(documentId) {
    return this.request(`/documents/${documentId}/restore/`, {
      method: 'POST'
    });
  }

  async downloadDocument(documentId) {
    const response = await fetch(`${this.baseURL}/documents/${documentId}/download/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  }

  // ========== КАТЕГОРИИ ==========

  async getCategories() {
    return this.request('/categories/');
  }

  async getCategory(categoryId) {
    return this.request(`/categories/${categoryId}/`);
  }

  async createCategory(categoryData) {
    return this.request('/categories/', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(categoryId, categoryData) {
    return this.request(`/categories/${categoryId}/`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(categoryId) {
    return this.request(`/categories/${categoryId}/`, {
      method: 'DELETE'
    });
  }

  async getCategoryTree() {
    return this.request('/categories/tree/');
  }

  async getCategoryDocuments(categoryId, params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/categories/${categoryId}/documents/?${queryParams}`);
  }

  // ========== ПОЛИТИКИ ХРАНЕНИЯ ==========

  async getRetentionPolicies() {
    return this.request('/retention-policies/');
  }

  async createRetentionPolicy(policyData) {
    return this.request('/retention-policies/', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  }

  async updateRetentionPolicy(policyId, policyData) {
    return this.request(`/retention-policies/${policyId}/`, {
      method: 'PATCH',
      body: JSON.stringify(policyData)
    });
  }

  async deleteRetentionPolicy(policyId) {
    return this.request(`/retention-policies/${policyId}/`, {
      method: 'DELETE'
    });
  }

  // ========== ПРАВИЛА АВТОАРХИВИРОВАНИЯ ==========

  async getAutoArchivingRules() {
    return this.request('/auto-rules/');
  }

  async getAutoArchivingRule(ruleId) {
    return this.request(`/auto-rules/${ruleId}/`);
  }

  async createAutoArchivingRule(ruleData) {
    return this.request('/auto-rules/', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
  }

  async updateAutoArchivingRule(ruleId, ruleData) {
    return this.request(`/auto-rules/${ruleId}/`, {
      method: 'PATCH',
      body: JSON.stringify(ruleData)
    });
  }

  async deleteAutoArchivingRule(ruleId) {
    return this.request(`/auto-rules/${ruleId}/`, {
      method: 'DELETE'
    });
  }

  async toggleAutoArchivingRule(ruleId, enabled) {
    return this.request(`/auto-rules/${ruleId}/toggle/`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  async executeAutoArchivingRule(ruleId) {
    return this.request(`/auto-rules/${ruleId}/execute/`, {
      method: 'POST'
    });
  }

  // ========== ЗАДАНИЯ АРХИВИРОВАНИЯ ==========

  async getArchivingJobs(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/jobs/?${queryParams}`);
  }

  async getArchivingJob(jobId) {
    return this.request(`/jobs/${jobId}/`);
  }

  async createArchivingJob(jobData) {
    return this.request('/jobs/', {
      method: 'POST',
      body: JSON.stringify(jobData)
    });
  }

  async cancelArchivingJob(jobId) {
    return this.request(`/jobs/${jobId}/cancel/`, {
      method: 'POST'
    });
  }

  async retryArchivingJob(jobId) {
    return this.request(`/jobs/${jobId}/retry/`, {
      method: 'POST'
    });
  }

  async getJobLogs(jobId) {
    return this.request(`/jobs/${jobId}/logs/`);
  }

  // ========== ИИ АНАЛИЗ ==========

  async getAIAnalyses(documentId) {
    return this.request(`/documents/${documentId}/ai-analyses/`);
  }

  async requestAIAnalysis(documentId, analysisTypes = []) {
    return this.request(`/documents/${documentId}/ai-analyses/`, {
      method: 'POST',
      body: JSON.stringify({
        analysis_types: analysisTypes
      })
    });
  }

  async getDocumentEmbedding(documentId) {
    return this.request(`/documents/${documentId}/embedding/`);
  }

  async findSimilarDocuments(documentId, limit = 10) {
    return this.request(`/documents/${documentId}/similar/?limit=${limit}`);
  }

  // ========== АНАЛИТИКА ==========

  async getAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/analytics/?${queryParams}`);
  }

  async getStorageMetrics(dateRange = '30d') {
    return this.request(`/analytics/storage/?range=${dateRange}`);
  }

  async getCategoryDistribution() {
    return this.request('/analytics/categories/');
  }

  async getAccessPatterns(dateRange = '30d') {
    return this.request(`/analytics/access-patterns/?range=${dateRange}`);
  }

  async getRetentionCompliance() {
    return this.request('/analytics/retention-compliance/');
  }

  async getAIAccuracyMetrics() {
    return this.request('/analytics/ai-accuracy/');
  }

  async exportAnalyticsReport(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${this.baseURL}/analytics/export/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  // ========== ПРАВА ДОСТУПА ==========

  async getDocumentPermissions(documentId) {
    return this.request(`/documents/${documentId}/permissions/`);
  }

  async grantDocumentPermission(documentId, userId, permissionType, expiresAt = null) {
    return this.request(`/documents/${documentId}/permissions/`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        permission_type: permissionType,
        expires_at: expiresAt
      })
    });
  }

  async revokeDocumentPermission(documentId, permissionId) {
    return this.request(`/documents/${documentId}/permissions/${permissionId}/`, {
      method: 'DELETE'
    });
  }

  // ========== СООТВЕТСТВИЕ ТРЕБОВАНИЯМ ==========

  async getComplianceRules() {
    return this.request('/compliance-rules/');
  }

  async checkDocumentCompliance(documentId) {
    return this.request(`/documents/${documentId}/compliance-check/`);
  }

  async generateComplianceReport(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/compliance/report/?${queryParams}`);
  }

  // ========== ЭКСПОРТ/ИМПОРТ ==========

  async exportDocuments(documentIds, format = 'zip') {
    const response = await fetch(`${this.baseURL}/export/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        document_ids: documentIds,
        format: format
      })
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  async importDocuments(formData) {
    return fetch(`${this.baseURL}/import/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });
  }

  // ========== УВЕДОМЛЕНИЯ ==========

  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/notifications/?${queryParams}`);
  }

  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read/`, {
      method: 'POST'
    });
  }

  async getExpiringDocuments(daysAhead = 30) {
    return this.request(`/documents/expiring/?days=${daysAhead}`);
  }

  // ========== СИСТЕМНЫЕ ОПЕРАЦИИ ==========

  async getSystemHealth() {
    return this.request('/system/health/');
  }

  async getStorageUsage() {
    return this.request('/system/storage/');
  }

  async runMaintenance(operation) {
    return this.request('/system/maintenance/', {
      method: 'POST',
      body: JSON.stringify({ operation })
    });
  }

  async getAuditLog(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/audit-log/?${queryParams}`);
  }
}

// Создать единственный экземпляр API
export const archiveAPI = new ArchiveAPI();
export default archiveAPI;
