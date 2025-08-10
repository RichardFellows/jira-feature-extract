import { create } from 'zustand';
import { QueryState, ApiError, JiraMetadata, QueryTemplate } from '@/types/app';
import { JiraIssue, JiraField, JiraProject, JiraIssueType } from '@/types/jira-api';
import { useConnectionStore } from './connection-store';
import { StorageService } from '@/services/storage';

interface QueryStoreState extends QueryState {
  metadata: JiraMetadata | null;
  templates: QueryTemplate[];
  selectedTemplate: QueryTemplate | null;
  queryHistory: Array<{ jql: string; resultCount: number; executedAt: Date }>;

  // Actions
  setJql: (jql: string) => void;
  executeQuery: () => Promise<void>;
  loadMoreResults: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  loadMetadata: () => Promise<void>;
  loadTemplates: () => void;
  saveTemplate: (template: QueryTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  selectTemplate: (template: QueryTemplate | null) => void;
  validateJql: () => Promise<boolean>;
}

const storageService = new StorageService();

export const useQueryStore = create<QueryStoreState>((set, get) => ({
  // Initial state
  jql: '',
  results: [],
  totalCount: 0,
  isLoading: false,
  error: undefined,
  startAt: 0,
  maxResults: 50,
  metadata: null,
  templates: [],
  selectedTemplate: null,
  queryHistory: [],

  // Actions
  setJql: (jql: string) => {
    set({ jql, selectedTemplate: null });
  },

  executeQuery: async () => {
    const state = get();
    const connectionState = useConnectionStore.getState();

    if (!connectionState.client) {
      set({ error: 'Not connected to JIRA' });
      return;
    }

    if (!state.jql.trim()) {
      set({ error: 'Please enter a JQL query' });
      return;
    }

    set({ 
      isLoading: true, 
      error: undefined,
      startAt: 0,
      results: [],
      totalCount: 0,
    });

    try {
      const response = await connectionState.client.search(
        state.jql,
        0,
        state.maxResults,
        ['*all'], // Include all fields
        ['changelog'] // Include changelog for history
      );

      set({
        results: response.issues,
        totalCount: response.total,
        startAt: response.startAt + response.issues.length,
        isLoading: false,
        error: undefined,
      });

      // Add to query history
      storageService.addToQueryHistory(state.jql, response.total);
      set({ queryHistory: storageService.loadQueryHistory() });

    } catch (error) {
      const apiError = error as ApiError;
      set({
        results: [],
        totalCount: 0,
        isLoading: false,
        error: apiError.message,
      });
    }
  },

  loadMoreResults: async () => {
    const state = get();
    const connectionState = useConnectionStore.getState();

    if (!connectionState.client || state.isLoading || state.startAt >= state.totalCount) {
      return;
    }

    set({ isLoading: true });

    try {
      const response = await connectionState.client.search(
        state.jql,
        state.startAt,
        state.maxResults,
        ['*all'],
        ['changelog']
      );

      set({
        results: [...state.results, ...response.issues],
        startAt: state.startAt + response.issues.length,
        isLoading: false,
      });

    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.message,
      });
    }
  },

  clearResults: () => {
    set({
      results: [],
      totalCount: 0,
      startAt: 0,
      error: undefined,
    });
  },

  clearError: () => {
    set({ error: undefined });
  },

  loadMetadata: async () => {
    const connectionState = useConnectionStore.getState();

    if (!connectionState.client) {
      return;
    }

    try {
      const [fields, projects, issueTypes] = await Promise.all([
        connectionState.client.getFields(),
        connectionState.client.getProjects(),
        connectionState.client.getIssueTypes(),
      ]);

      const metadata: JiraMetadata = {
        fields,
        projects: projects.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
        })),
        issueTypes: issueTypes.map(it => ({
          id: it.id,
          name: it.name,
          subtask: it.subtask,
        })),
        priorities: [], // Will be populated when needed
        statuses: [], // Will be populated when needed
      };

      set({ metadata });

    } catch (error) {
      console.warn('Failed to load JIRA metadata:', error);
    }
  },

  loadTemplates: () => {
    const templates = storageService.loadQueryTemplates();
    const history = storageService.loadQueryHistory();
    set({ templates, queryHistory: history });
  },

  saveTemplate: (template: QueryTemplate) => {
    storageService.saveQueryTemplate(template);
    const templates = storageService.loadQueryTemplates();
    set({ templates });
  },

  deleteTemplate: (templateId: string) => {
    storageService.deleteQueryTemplate(templateId);
    const templates = storageService.loadQueryTemplates();
    set({ templates });
  },

  selectTemplate: (template: QueryTemplate | null) => {
    set({ 
      selectedTemplate: template,
      jql: template ? template.jql : get().jql,
    });

    // Update last used date if template is selected
    if (template) {
      const updatedTemplate = { ...template, lastUsed: new Date() };
      get().saveTemplate(updatedTemplate);
    }
  },

  validateJql: async (): Promise<boolean> => {
    const state = get();
    const connectionState = useConnectionStore.getState();

    if (!connectionState.client || !state.jql.trim()) {
      return false;
    }

    try {
      const result = await connectionState.client.validateJql(state.jql);
      if (!result.valid && result.errors) {
        set({ error: result.errors.join('; ') });
      }
      return result.valid;
    } catch (error) {
      return false;
    }
  },
}));

// Initialize with templates and history
useQueryStore.getState().loadTemplates();