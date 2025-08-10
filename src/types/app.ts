import { JiraIssue, JiraField } from './jira-api';

export interface ConnectionConfig {
  serverUrl: string;
  token: string;
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
}

export interface QueryState {
  jql: string;
  results: JiraIssue[];
  totalCount: number;
  isLoading: boolean;
  error?: string;
  startAt: number;
  maxResults: number;
}

export interface ExportConfig {
  format: 'xml' | 'json' | 'csv';
  includeFields: string[];
  includeComments: boolean;
  includeAttachments: boolean;
  includeWorklog: boolean;
  includeSubtasks: boolean;
  includeLinks: boolean;
  customXmlTemplate?: string;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error?: string;
  lastExportedAt?: Date;
  totalItems?: number;
  processedItems?: number;
}

export interface JiraMetadata {
  fields: JiraField[];
  projects: Array<{
    id: string;
    key: string;
    name: string;
  }>;
  issueTypes: Array<{
    id: string;
    name: string;
    subtask: boolean;
  }>;
  priorities: Array<{
    id: string;
    name: string;
  }>;
  statuses: Array<{
    id: string;
    name: string;
    statusCategory: string;
  }>;
}

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  jql: string;
  createdAt: Date;
  lastUsed?: Date;
  isFavorite: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  maxResults: number;
  autoSave: boolean;
  showAdvancedOptions: boolean;
  defaultExportFormat: 'xml' | 'json' | 'csv';
  rememberCredentials: boolean;
}

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  stage: 'fetching' | 'processing' | 'exporting' | 'complete' | 'error';
  message?: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: string;
  timestamp: Date;
}