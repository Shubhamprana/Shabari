/**
 * deepScanStore.ts
 * 
 * Zustand store for Deep Scan state management.
 * Provides reactive state updates for scan progress, results, and configuration.
 * 
 * @module deepScanStore
 * @author Shabari Security Team
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeepScanProgress,
  DeepScanResult,
  DeepScanConfig,
  DeepScanStoreState
} from '../types/deepScan.types';

/**
 * Default Deep Scan Configuration
 */
const DEFAULT_CONFIG: DeepScanConfig = {
  scanType: 'full',
  
  // File Scanning
  scanDownloads: true,
  scanDocuments: true,
  scanImages: false,
  scanWhatsApp: true,
  scanTelegram: true,
  scanApkFiles: true,
  scanCache: false,
  scanSystemDirs: false,
  
  // App Scanning
  scanAppPermissions: true,
  scanAllApps: true,
  scanSystemApps: false,
  scanUserApps: true,
  
  // Permission Analysis
  enablePermissionAnalysis: true,
  analyzeApkPermissions: true,
  analyzeFilePermissions: true,
  analyzeSocialMediaPermissions: true,
  detectMaliciousPermissions: true,
  checkPermissionCombinations: true,
  
  // Folder Scanning
  scanAllFolders: true,
  scanSocialMediaFolders: true,
  scanInstagram: true,
  scanFacebook: true,
  scanTwitter: true,
  
  // Settings
  maxFileSize: 100 * 1024 * 1024, // 100MB
  enableYaraEngine: true,
  enableHeuristicScan: true,
  enableAutoQuarantine: false,
  skipSystemFiles: true,
  skipHiddenFiles: true,
  recursiveScan: true,
  maxScanDepth: 5,
  
  // Performance
  scanPriority: 'balanced',
  maxConcurrentScans: 3,
  batchSize: 50,
  
  // Filters
  fileExtensions: [],
  skipExtensions: ['.tmp', '.cache', '.log'],
  minFileSize: 0
};

/**
 * Deep Scan Store
 * 
 * Manages global state for deep scan operations including:
 * - Scan progress tracking
 * - Scan results and history
 * - Configuration management
 * - Scan lifecycle (start, pause, resume, cancel)
 */
export const useDeepScanStore = create<DeepScanStoreState>()(
  persist(
    (set, get) => ({
      // ==================== STATE ====================
      
      isScanning: false,
      isPaused: false,
      currentProgress: null,
      currentResult: null,
      scanHistory: [],
      config: DEFAULT_CONFIG,

      // ==================== ACTIONS ====================

      /**
       * Start a new scan
       */
      startScan: (config: DeepScanConfig) => {
        set({
          isScanning: true,
          isPaused: false,
          currentProgress: {
            stage: 'initializing',
            currentDirectory: '',
            currentFile: '',
            currentApp: '',
            filesScanned: 0,
            totalFiles: 0,
            appsScanned: 0,
            totalApps: 0,
            threatsFound: 0,
            percentage: 0,
            elapsedTime: 0,
            estimatedTimeRemaining: 0,
            message: 'Initializing scan...'
          },
          currentResult: null,
          config
        });
      },

      /**
       * Update scan progress
       */
      updateProgress: (progress: DeepScanProgress) => {
        set({ currentProgress: progress });
      },

      /**
       * Complete scan with results
       */
      completeScan: (result: DeepScanResult) => {
        const { scanHistory } = get();
        
        set({
          isScanning: false,
          isPaused: false,
          currentProgress: null,
          currentResult: result,
          scanHistory: [result, ...scanHistory].slice(0, 10) // Keep last 10 scans
        });
      },

      /**
       * Cancel ongoing scan
       */
      cancelScan: () => {
        set({
          isScanning: false,
          isPaused: false,
          currentProgress: null
        });
      },

      /**
       * Pause ongoing scan
       */
      pauseScan: () => {
        set({ isPaused: true });
      },

      /**
       * Resume paused scan
       */
      resumeScan: () => {
        set({ isPaused: false });
      },

      /**
       * Update scan configuration
       */
      setConfig: (config: DeepScanConfig) => {
        set({ config });
      },

      /**
       * Add scan result to history
       */
      addToHistory: (result: DeepScanResult) => {
        const { scanHistory } = get();
        set({
          scanHistory: [result, ...scanHistory].slice(0, 10)
        });
      },

      /**
       * Clear scan history
       */
      clearHistory: () => {
        set({ scanHistory: [] });
      }
    }),
    {
      name: 'deep-scan-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        scanHistory: state.scanHistory,
        config: state.config
      })
    }
  )
);

// ==================== SELECTORS ====================

/**
 * Get current scan status
 */
export const selectIsScanning = (state: DeepScanStoreState) => state.isScanning;

/**
 * Get current progress
 */
export const selectCurrentProgress = (state: DeepScanStoreState) => state.currentProgress;

/**
 * Get current result
 */
export const selectCurrentResult = (state: DeepScanStoreState) => state.currentResult;

/**
 * Get scan history
 */
export const selectScanHistory = (state: DeepScanStoreState) => state.scanHistory;

/**
 * Get scan configuration
 */
export const selectConfig = (state: DeepScanStoreState) => state.config;

/**
 * Get last scan result
 */
export const selectLastScan = (state: DeepScanStoreState) => 
  state.scanHistory.length > 0 ? state.scanHistory[0] : null;

/**
 * Get total threats from all scans
 */
export const selectTotalThreats = (state: DeepScanStoreState) =>
  state.scanHistory.reduce((total, scan) => total + scan.threatsDetected.length, 0);

/**
 * Get scan statistics
 */
export const selectScanStatistics = (state: DeepScanStoreState) => {
  const { scanHistory } = state;
  
  if (scanHistory.length === 0) {
    return {
      totalScans: 0,
      totalThreats: 0,
      totalFilesScanned: 0,
      averageScanDuration: 0,
      lastScanDate: null
    };
  }

  return {
    totalScans: scanHistory.length,
    totalThreats: scanHistory.reduce((sum, scan) => sum + scan.threatsDetected.length, 0),
    totalFilesScanned: scanHistory.reduce((sum, scan) => sum + scan.totalFilesScanned, 0),
    averageScanDuration: scanHistory.reduce((sum, scan) => sum + scan.scanDuration, 0) / scanHistory.length,
    lastScanDate: scanHistory[0]?.scanEndTime || null
  };
};

/**
 * Get threat severity counts
 */
export const selectThreatSeverityCounts = (state: DeepScanStoreState) => {
  const allThreats = state.scanHistory.flatMap(scan => scan.threatsDetected);
  
  return {
    critical: allThreats.filter(t => t.severity === 'critical').length,
    high: allThreats.filter(t => t.severity === 'high').length,
    medium: allThreats.filter(t => t.severity === 'medium').length,
    low: allThreats.filter(t => t.severity === 'low').length
  };
};

// ==================== HOOKS ====================

/**
 * Hook to get scan status
 */
export const useScanStatus = () => {
  const isScanning = useDeepScanStore(selectIsScanning);
  const isPaused = useDeepScanStore(state => state.isPaused);
  const progress = useDeepScanStore(selectCurrentProgress);
  
  return { isScanning, isPaused, progress };
};

/**
 * Hook to get scan results
 */
export const useScanResults = () => {
  const currentResult = useDeepScanStore(selectCurrentResult);
  const scanHistory = useDeepScanStore(selectScanHistory);
  const lastScan = useDeepScanStore(selectLastScan);
  
  return { currentResult, scanHistory, lastScan };
};

/**
 * Hook to get scan actions
 */
export const useScanActions = () => {
  const startScan = useDeepScanStore(state => state.startScan);
  const cancelScan = useDeepScanStore(state => state.cancelScan);
  const pauseScan = useDeepScanStore(state => state.pauseScan);
  const resumeScan = useDeepScanStore(state => state.resumeScan);
  
  return { startScan, cancelScan, pauseScan, resumeScan };
};

/**
 * Hook to get scan configuration
 */
export const useScanConfig = () => {
  const config = useDeepScanStore(selectConfig);
  const setConfig = useDeepScanStore(state => state.setConfig);
  
  return { config, setConfig };
};

/**
 * Hook to get scan statistics
 */
export const useScanStatistics = () => {
  const statistics = useDeepScanStore(selectScanStatistics);
  const severityCounts = useDeepScanStore(selectThreatSeverityCounts);
  const totalThreats = useDeepScanStore(selectTotalThreats);
  
  return { statistics, severityCounts, totalThreats };
};

export default useDeepScanStore;
