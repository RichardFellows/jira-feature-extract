import { QueryTemplate, AppSettings, ConnectionConfig } from '@/types/app';

const STORAGE_KEYS = {
  CONNECTION: 'jira-extractor-connection',
  QUERY_TEMPLATES: 'jira-extractor-templates',
  APP_SETTINGS: 'jira-extractor-settings',
  QUERY_HISTORY: 'jira-extractor-history',
} as const;

export class StorageService {
  /**
   * Save connection configuration (excluding sensitive data if not allowed)
   */
  saveConnection(config: ConnectionConfig, rememberCredentials: boolean = false): void {
    const dataToStore = {
      serverUrl: config.serverUrl,
      email: rememberCredentials ? config.email : '',
      token: rememberCredentials ? config.token : '',
      isConnected: false, // Never persist connection state
    };

    sessionStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(dataToStore));
  }

  /**
   * Load connection configuration
   */
  loadConnection(): Partial<ConnectionConfig> {
    const stored = sessionStorage.getItem(STORAGE_KEYS.CONNECTION);
    if (!stored) return {};

    try {
      const config = JSON.parse(stored);
      return {
        serverUrl: config.serverUrl || '',
        email: config.email || '',
        token: config.token || '',
        isConnected: false,
        isLoading: false,
      };
    } catch (error) {
      console.warn('Failed to load connection config:', error);
      return {};
    }
  }

  /**
   * Clear connection data
   */
  clearConnection(): void {
    sessionStorage.removeItem(STORAGE_KEYS.CONNECTION);
  }

  /**
   * Save query templates
   */
  saveQueryTemplates(templates: QueryTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUERY_TEMPLATES, JSON.stringify(templates));
    } catch (error) {
      console.warn('Failed to save query templates:', error);
    }
  }

  /**
   * Load query templates
   */
  loadQueryTemplates(): QueryTemplate[] {
    const stored = localStorage.getItem(STORAGE_KEYS.QUERY_TEMPLATES);
    if (!stored) return this.getDefaultQueryTemplates();

    try {
      const templates = JSON.parse(stored);
      return Array.isArray(templates) ? templates : this.getDefaultQueryTemplates();
    } catch (error) {
      console.warn('Failed to load query templates:', error);
      return this.getDefaultQueryTemplates();
    }
  }

  /**
   * Get default query templates
   */
  private getDefaultQueryTemplates(): QueryTemplate[] {
    return [
      {
        id: 'all-open',
        name: 'All Open Issues',
        description: 'All issues that are not resolved or closed',
        jql: 'status NOT IN (Resolved, Closed, Done)',
        createdAt: new Date(),
        isFavorite: false,
      },
      {
        id: 'assigned-to-me',
        name: 'Assigned to Me',
        description: 'Issues assigned to current user',
        jql: 'assignee = currentUser() AND status != Done',
        createdAt: new Date(),
        isFavorite: true,
      },
      {
        id: 'reported-by-me',
        name: 'Reported by Me',
        description: 'Issues reported by current user',
        jql: 'reporter = currentUser()',
        createdAt: new Date(),
        isFavorite: false,
      },
      {
        id: 'updated-recently',
        name: 'Updated Recently',
        description: 'Issues updated in the last 7 days',
        jql: 'updated >= -7d ORDER BY updated DESC',
        createdAt: new Date(),
        isFavorite: false,
      },
      {
        id: 'high-priority',
        name: 'High Priority Issues',
        description: 'Issues with high or highest priority',
        jql: 'priority IN (High, Highest) AND status != Done ORDER BY priority DESC',
        createdAt: new Date(),
        isFavorite: false,
      },
    ];
  }

  /**
   * Add or update query template
   */
  saveQueryTemplate(template: QueryTemplate): void {
    const templates = this.loadQueryTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    this.saveQueryTemplates(templates);
  }

  /**
   * Delete query template
   */
  deleteQueryTemplate(templateId: string): void {
    const templates = this.loadQueryTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    this.saveQueryTemplates(filtered);
  }

  /**
   * Save application settings
   */
  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save app settings:', error);
    }
  }

  /**
   * Load application settings
   */
  loadSettings(): AppSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!stored) return this.getDefaultSettings();

    try {
      const settings = JSON.parse(stored);
      return { ...this.getDefaultSettings(), ...settings };
    } catch (error) {
      console.warn('Failed to load app settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default application settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      theme: 'light',
      maxResults: 100,
      autoSave: true,
      showAdvancedOptions: false,
      defaultExportFormat: 'xml',
      rememberCredentials: false,
    };
  }

  /**
   * Save query to history
   */
  addToQueryHistory(jql: string, resultCount: number): void {
    const history = this.loadQueryHistory();
    
    // Remove existing entry for this JQL if it exists
    const filtered = history.filter(item => item.jql !== jql);
    
    // Add new entry at the beginning
    filtered.unshift({
      jql,
      resultCount,
      executedAt: new Date(),
    });

    // Keep only last 50 queries
    const trimmed = filtered.slice(0, 50);

    try {
      localStorage.setItem(STORAGE_KEYS.QUERY_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }
  }

  /**
   * Load query history
   */
  loadQueryHistory(): Array<{ jql: string; resultCount: number; executedAt: Date }> {
    const stored = localStorage.getItem(STORAGE_KEYS.QUERY_HISTORY);
    if (!stored) return [];

    try {
      const history = JSON.parse(stored);
      return Array.isArray(history) 
        ? history.map(item => ({
            ...item,
            executedAt: new Date(item.executedAt),
          }))
        : [];
    } catch (error) {
      console.warn('Failed to load query history:', error);
      return [];
    }
  }

  /**
   * Clear query history
   */
  clearQueryHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.QUERY_HISTORY);
  }

  /**
   * Clear all stored data
   */
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = {
      templates: this.loadQueryTemplates(),
      settings: this.loadSettings(),
      history: this.loadQueryHistory(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.templates && Array.isArray(data.templates)) {
        this.saveQueryTemplates(data.templates);
      }

      if (data.settings) {
        this.saveSettings({ ...this.getDefaultSettings(), ...data.settings });
      }

      if (data.history && Array.isArray(data.history)) {
        localStorage.setItem(STORAGE_KEYS.QUERY_HISTORY, JSON.stringify(data.history));
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}