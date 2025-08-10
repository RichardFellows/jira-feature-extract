import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  JiraSearchResponse, 
  JiraMyself, 
  JiraField, 
  JiraServerInfo,
  JiraProject,
  JiraIssueType 
} from '@/types/jira-api';
import { ApiError } from '@/types/app';

export class JiraClient {
  private client: AxiosInstance;
  private serverUrl: string;
  private token: string;

  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${this.serverUrl}/rest/api/2`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          status: error.response?.status || 0,
          message: this.getErrorMessage(error),
          details: error.response?.data ? JSON.stringify(error.response.data) : undefined,
          timestamp: new Date(),
        };
        throw apiError;
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.errorMessages && Array.isArray(data.errorMessages)) {
        return data.errorMessages.join('; ');
      }
      if (data.message) {
        return data.message;
      }
    }

    if (error.response?.status === 401) {
      return 'Authentication failed. Please check your credentials.';
    }
    if (error.response?.status === 403) {
      return 'Access denied. You do not have permission to perform this operation.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found. Please check the server URL.';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. Please check the server URL and network connectivity.';
    }
    if (error.code === 'ENOTFOUND') {
      return 'Server not found. Please check the server URL.';
    }

    return error.message || 'An unexpected error occurred';
  }

  /**
   * Test the connection by fetching current user info
   */
  async testConnection(): Promise<JiraMyself> {
    const response = await this.client.get<JiraMyself>('/myself');
    return response.data;
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<JiraServerInfo> {
    const response = await this.client.get<JiraServerInfo>('/serverInfo');
    return response.data;
  }

  /**
   * Execute JQL query and return results
   */
  async search(
    jql: string,
    startAt: number = 0,
    maxResults: number = 50,
    fields?: string[],
    expand?: string[]
  ): Promise<JiraSearchResponse> {
    const params: any = {
      jql,
      startAt,
      maxResults,
    };

    if (fields && fields.length > 0) {
      params.fields = fields.join(',');
    }

    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }

    const response = await this.client.get<JiraSearchResponse>('/search', { params });
    return response.data;
  }

  /**
   * Get all issues for a JQL query with pagination
   */
  async *searchAll(
    jql: string,
    batchSize: number = 100,
    fields?: string[],
    expand?: string[],
    onProgress?: (current: number, total: number) => void
  ): AsyncGenerator<JiraSearchResponse, void, unknown> {
    let startAt = 0;
    let total = 0;

    do {
      const response = await this.search(jql, startAt, batchSize, fields, expand);
      
      if (total === 0) {
        total = response.total;
      }

      yield response;

      if (onProgress) {
        onProgress(startAt + response.issues.length, total);
      }

      startAt += batchSize;

      // Break if we've received all issues
      if (startAt >= response.total) {
        break;
      }
    } while (true);
  }

  /**
   * Get all available fields
   */
  async getFields(): Promise<JiraField[]> {
    const response = await this.client.get<JiraField[]>('/field');
    return response.data;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<JiraProject[]> {
    const response = await this.client.get<JiraProject[]>('/project');
    return response.data;
  }

  /**
   * Get all issue types
   */
  async getIssueTypes(): Promise<JiraIssueType[]> {
    const response = await this.client.get<JiraIssueType[]>('/issuetype');
    return response.data;
  }

  /**
   * Validate JQL query
   */
  async validateJql(jql: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      await this.client.post('/jql/parse', { queries: [jql] });
      return { valid: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { 
        valid: false, 
        errors: [apiError.message] 
      };
    }
  }

  /**
   * Get issue count for JQL query without fetching issues
   */
  async getIssueCount(jql: string): Promise<number> {
    const response = await this.search(jql, 0, 0, ['id']);
    return response.total;
  }

  /**
   * Update client configuration
   */
  updateConfig(serverUrl: string, token: string): void {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.token = token;

    // Update axios instance
    this.client.defaults.baseURL = `${this.serverUrl}/rest/api/2`;
    this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
  }

  /**
   * Cancel all pending requests
   */
  cancelRequests(): void {
    // This would be used with AbortController in a real implementation
    // For now, we'll just log the action
    console.warn('Request cancellation requested');
  }
}