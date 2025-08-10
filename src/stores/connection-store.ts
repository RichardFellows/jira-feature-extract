import { create } from 'zustand';
import { ConnectionConfig, ApiError } from '@/types/app';
import { JiraMyself } from '@/types/jira-api';
import { JiraClient } from '@/services/jira-client';
import { StorageService } from '@/services/storage';

interface ConnectionState extends ConnectionConfig {
  client: JiraClient | null;
  userInfo: JiraMyself | null;
  
  // Actions
  setConfig: (config: Partial<ConnectionConfig>) => void;
  testConnection: () => Promise<boolean>;
  connect: (serverUrl: string, token: string) => Promise<boolean>;
  disconnect: () => void;
  clearError: () => void;
}

const storageService = new StorageService();

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  // Initial state
  serverUrl: '',
  token: '',
  isConnected: false,
  isLoading: false,
  error: undefined,
  client: null,
  userInfo: null,

  // Actions
  setConfig: (config: Partial<ConnectionConfig>) => {
    set((state) => ({ ...state, ...config }));
  },

  testConnection: async (): Promise<boolean> => {
    const state = get();
    if (!state.serverUrl || !state.token) {
      set({ error: 'Please provide server URL and API token' });
      return false;
    }

    set({ isLoading: true, error: undefined });

    try {
      const client = new JiraClient(state.serverUrl, state.token);
      const userInfo = await client.testConnection();
      
      set({
        client,
        userInfo,
        isConnected: true,
        isLoading: false,
        error: undefined,
      });

      // Save connection config (respecting user preferences)
      const settings = storageService.loadSettings();
      storageService.saveConnection(
        { serverUrl: state.serverUrl, token: state.token, isConnected: true, isLoading: false },
        settings.rememberCredentials
      );

      return true;
    } catch (error) {
      const apiError = error as ApiError;
      set({
        client: null,
        userInfo: null,
        isConnected: false,
        isLoading: false,
        error: apiError.message,
      });

      return false;
    }
  },

  connect: async (serverUrl: string, token: string): Promise<boolean> => {
    set({
      serverUrl: serverUrl.trim(),
      token: token.trim(),
    });

    return get().testConnection();
  },

  disconnect: () => {
    set({
      isConnected: false,
      client: null,
      userInfo: null,
      error: undefined,
    });

    // Clear stored credentials
    storageService.clearConnection();
  },

  clearError: () => {
    set({ error: undefined });
  },
}));

// Initialize store with saved connection data
const savedConnection = storageService.loadConnection();
if (savedConnection.serverUrl) {
  useConnectionStore.getState().setConfig(savedConnection);
}