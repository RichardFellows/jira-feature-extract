import { create } from 'zustand';
import { ExportConfig, ExportState, ProgressInfo } from '@/types/app';
import { ExportService } from '@/services/export-service';
import { useQueryStore } from './query-store';

interface ExportStoreState {
  config: ExportConfig;
  state: ExportState;
  progressInfo: ProgressInfo | null;

  // Actions
  setConfig: (config: Partial<ExportConfig>) => void;
  exportData: () => Promise<void>;
  cancelExport: () => void;
  clearProgress: () => void;
  resetState: () => void;
}

const defaultConfig: ExportConfig = {
  format: 'xml',
  includeFields: [],
  includeComments: false,
  includeAttachments: false,
  includeWorklog: false,
  includeSubtasks: true,
  includeLinks: false,
};

const exportService = new ExportService();

export const useExportStore = create<ExportStoreState>((set, get) => ({
  // Initial state
  config: defaultConfig,
  state: {
    isExporting: false,
    progress: 0,
    error: undefined,
    lastExportedAt: undefined,
    totalItems: undefined,
    processedItems: undefined,
  },
  progressInfo: null,

  // Actions
  setConfig: (configUpdate: Partial<ExportConfig>) => {
    set((state) => ({
      config: { ...state.config, ...configUpdate },
    }));
  },

  exportData: async () => {
    const queryState = useQueryStore.getState();
    
    if (queryState.results.length === 0) {
      set({
        state: {
          isExporting: false,
          progress: 0,
          error: 'No data to export. Please execute a query first.',
        },
      });
      return;
    }

    const state = get();
    const startTime = new Date();

    set({
      state: {
        isExporting: true,
        progress: 0,
        error: undefined,
        totalItems: queryState.results.length,
        processedItems: 0,
      },
      progressInfo: {
        current: 0,
        total: queryState.results.length,
        percentage: 0,
        stage: 'processing',
        message: 'Starting export...',
        startTime,
      },
    });

    try {
      await exportService.export(
        queryState.results,
        state.config,
        (progress: ProgressInfo) => {
          set({
            progressInfo: progress,
            state: {
              isExporting: true,
              progress: progress.percentage,
              totalItems: progress.total,
              processedItems: progress.current,
            },
          });
        }
      );

      set({
        state: {
          isExporting: false,
          progress: 100,
          error: undefined,
          lastExportedAt: new Date(),
          totalItems: queryState.results.length,
          processedItems: queryState.results.length,
        },
        progressInfo: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      set({
        state: {
          isExporting: false,
          progress: 0,
          error: errorMessage,
          lastExportedAt: undefined,
        },
        progressInfo: {
          current: 0,
          total: queryState.results.length,
          percentage: 0,
          stage: 'error',
          message: errorMessage,
          startTime,
        },
      });
    }
  },

  cancelExport: () => {
    // In a real implementation, this would cancel ongoing operations
    set({
      state: {
        isExporting: false,
        progress: 0,
        error: undefined,
      },
      progressInfo: null,
    });
  },

  clearProgress: () => {
    set({ progressInfo: null });
  },

  resetState: () => {
    set({
      state: {
        isExporting: false,
        progress: 0,
        error: undefined,
        lastExportedAt: undefined,
        totalItems: undefined,
        processedItems: undefined,
      },
      progressInfo: null,
    });
  },
}));