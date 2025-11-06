/**
 * EnhancedDeepScanService.ts
 * 
 * Enhanced comprehensive device security scanner with:
 * - Advanced permission analysis
 * - APK file scanning
 * - Social media file analysis
 * - Folder-wide scanning
 * - Malicious pattern detection
 * - Real-time progress tracking
 * 
 * @module EnhancedDeepScanService
 * @author Shabari Security Team
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { YaraSecurityService } from './YaraSecurityService';
import DeepScanPermissionAnalyzer, { PermissionRiskAssessment, RiskLevel } from './DeepScanPermissionAnalyzer';
import DeepScanApkAnalyzer, { ApkAnalysis } from './DeepScanApkAnalyzer';
import DeepScanSocialMediaAnalyzer, { SocialMediaFileInfo } from './DeepScanSocialMediaAnalyzer';
import DeepScanFolderScanner, { FolderScanResult, AllFoldersScanResult } from './DeepScanFolderScanner';

// ==================== TYPES ====================

export interface DeepScanProgress {
  stage: 'initializing' | 'permissions' | 'scanning_files' | 'analyzing_apps' | 
         'analyzing_threats' | 'scanning_folders' | 'scanning_social_media' |
         'complete' | 'error' | 'cancelled' | 'paused';
  currentDirectory: string;
  currentFile: string;
  currentApp: string;
  filesScanned: number;
  totalFiles: number;
  appsScanned: number;
  totalApps: number;
  threatsFound: number;
  percentage: number;
  elapsedTime: number; // milliseconds
  estimatedTimeRemaining: number; // milliseconds
  message: string;
  subStage?: string;
  currentThreat?: DeepScanThreat;
}

export interface DeepScanThreat {
  id: string;
  type: 'file' | 'app' | 'permission' | 'system';
  filePath?: string;
  appPackageName?: string;
  fileName: string;
  fileSize: number;
  threatType: 'malware' | 'suspicious_apk' | 'corrupted_file' | 'dangerous_file' | 
              'risky_permissions' | 'suspicious_behavior' | 'social_media_threat' | 'unknown';
  threatName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  description: string;
  recommendations: string[];
  scanEngine: string;
  detectedAt: Date;
  fileHash?: string;
  yaraRules?: string[];
  confidence: number; // 0-100
  falsePositiveRisk: number; // 0-100
  actions: ThreatAction[];
}

export interface ThreatAction {
  action: 'quarantine' | 'delete' | 'ignore' | 'scan_again' | 'view_details';
  label: string;
  description: string;
  isDestructive: boolean;
}

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  type: string;
  scanTime: number;
  isSafe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  scanEngine: string;
}

export interface ScannedApp {
  packageName: string;
  appName: string;
  version: string;
  permissions: string[];
  riskyPermissions: string[];
  riskScore: number; // 0-100
  isSafe: boolean;
  scanTime: number;
}

export interface RiskyApp {
  packageName: string;
  appName: string;
  riskReasons: string[];
  riskScore: number;
  recommendedAction: 'warn' | 'uninstall' | 'review';
}

export interface DeepScanResult {
  scanId: string;
  success: boolean;
  scanStartTime: Date;
  scanEndTime: Date;
  scanDuration: number; // milliseconds
  scanType: 'quick' | 'full' | 'custom';
  config: DeepScanConfig;
  
  // File Scanning Results
  totalFilesScanned: number;
  filesScanned: ScannedFile[];
  threatsDetected: DeepScanThreat[];
  safeFilesCount: number;
  skippedFilesCount: number;
  errorCount: number;
  
  // App Scanning Results
  totalAppsScanned: number;
  appsScanned: ScannedApp[];
  riskyApps: RiskyApp[];
  
  // Folder Scanning Results
  folderScanResults?: AllFoldersScanResult;
  
  // Social Media Results
  socialMediaThreats: SocialMediaFileInfo[];
  
  // APK Results
  apkFilesFound: number;
  riskyApkFiles: number;
  
  // Directories
  directoriesScanned: string[];
  directoriesWithThreats: string[];
  
  // Engine Info
  scanEngineVersion: string;
  isNativeYaraUsed: boolean;
  yaraRulesMatched: string[];
  
  // Device Info
  deviceInfo: {
    platform: string;
    storageScanned: number; // bytes
    totalStorage: number; // bytes
    freeStorage: number; // bytes;
  };
  
  // Statistics
  statistics: {
    averageScanTimePerFile: number;
    fastestScanTime: number;
    slowestScanTime: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
  };
  
  // Errors
  errors: ScanError[];
}

export interface ScanError {
  type: 'permission_denied' | 'file_not_found' | 'scan_failed' | 'unknown';
  message: string;
  filePath?: string;
  timestamp: Date;
}

export interface DeepScanConfig {
  scanType: 'quick' | 'full' | 'custom';
  
  // File Scanning
  scanDownloads: boolean;
  scanDocuments: boolean;
  scanImages: boolean;
  scanWhatsApp: boolean;
  scanTelegram: boolean;
  scanApkFiles: boolean;
  scanCache: boolean;
  scanSystemDirs: boolean;
  
  // App Scanning
  scanAppPermissions: boolean;
  scanAllApps: boolean;
  scanSystemApps: boolean;
  scanUserApps: boolean;
  
  // Permission Analysis
  enablePermissionAnalysis: boolean;
  analyzeApkPermissions: boolean;
  analyzeFilePermissions: boolean;
  analyzeSocialMediaPermissions: boolean;
  detectMaliciousPermissions: boolean;
  checkPermissionCombinations: boolean;
  
  // Folder Scanning
  scanAllFolders: boolean;
  scanSocialMediaFolders: boolean;
  scanInstagram: boolean;
  scanFacebook: boolean;
  scanTwitter: boolean;
  
  // Settings
  maxFileSize: number; // bytes
  enableYaraEngine: boolean;
  enableHeuristicScan: boolean;
  enableAutoQuarantine: boolean;
  skipSystemFiles: boolean;
  skipHiddenFiles: boolean;
  recursiveScan: boolean;
  maxScanDepth: number;
  
  // Performance
  scanPriority: 'speed' | 'balanced' | 'thorough';
  maxConcurrentScans: number;
  batchSize: number;
  
  // Filters
  fileExtensions: string[];
  skipExtensions: string[];
  minFileSize: number;
}

export interface ScanStatistics {
  totalScans: number;
  lastScanDate: Date | null;
  totalThreatsFound: number;
  totalFilesScanned: number;
  averageScanDuration: number;
}

export interface ThreatStatistics {
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  malwareDetected: number;
  suspiciousApks: number;
  riskyPermissions: number;
}

// ==================== DEFAULT CONFIGURATION ====================

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

const QUICK_SCAN_CONFIG: Partial<DeepScanConfig> = {
  scanType: 'quick',
  scanDownloads: true,
  scanDocuments: false,
  scanImages: false,
  scanWhatsApp: false,
  scanTelegram: false,
  scanCache: false,
  scanSystemDirs: false,
  scanAllFolders: false,
  scanSocialMediaFolders: false,
  recursiveScan: false,
  maxScanDepth: 2,
  scanPriority: 'speed'
};

const FULL_SCAN_CONFIG: Partial<DeepScanConfig> = {
  scanType: 'full',
  scanDownloads: true,
  scanDocuments: true,
  scanImages: true,
  scanWhatsApp: true,
  scanTelegram: true,
  scanCache: true,
  scanSystemDirs: false,
  scanAllFolders: true,
  scanSocialMediaFolders: true,
  recursiveScan: true,
  maxScanDepth: 10,
  scanPriority: 'thorough'
};

// ==================== CLASS ====================

/**
 * EnhancedDeepScanService
 * 
 * Comprehensive device security scanner with advanced threat detection,
 * permission analysis, and real-time progress tracking.
 */
export class EnhancedDeepScanService {
  private static instance: EnhancedDeepScanService;
  
  private yaraService: YaraSecurityService;
  private permissionAnalyzer: typeof DeepScanPermissionAnalyzer;
  private apkAnalyzer: typeof DeepScanApkAnalyzer;
  private socialMediaAnalyzer: typeof DeepScanSocialMediaAnalyzer;
  private folderScanner: typeof DeepScanFolderScanner;
  
  private currentScanId: string | null = null;
  private isScanInProgress: boolean = false;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private scanStartTime: Date | null = null;
  private currentProgress: DeepScanProgress | null = null;
  
  private scanHistory: DeepScanResult[] = [];
  private maxHistorySize: number = 10;

  private constructor() {
    this.yaraService = YaraSecurityService.getInstance();
    this.permissionAnalyzer = DeepScanPermissionAnalyzer;
    this.apkAnalyzer = DeepScanApkAnalyzer;
    this.socialMediaAnalyzer = DeepScanSocialMediaAnalyzer;
    this.folderScanner = DeepScanFolderScanner;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedDeepScanService {
    if (!EnhancedDeepScanService.instance) {
      EnhancedDeepScanService.instance = new EnhancedDeepScanService();
    }
    return EnhancedDeepScanService.instance;
  }

  /**
   * Perform comprehensive deep scan
   */
  public async performDeepScan(
    config: Partial<DeepScanConfig> = {},
    onProgress?: (progress: DeepScanProgress) => void
  ): Promise<DeepScanResult> {
    if (this.isScanInProgress) {
      throw new Error('A scan is already in progress');
    }

    this.isScanInProgress = true;
    this.isCancelled = false;
    this.isPaused = false;
    this.scanStartTime = new Date();
    this.currentScanId = this.generateScanId();

    const fullConfig: DeepScanConfig = { ...DEFAULT_CONFIG, ...config };
    const threatsDetected: DeepScanThreat[] = [];
    const filesScanned: ScannedFile[] = [];
    const appsScanned: ScannedApp[] = [];
    const riskyApps: RiskyApp[] = [];
    const socialMediaThreats: SocialMediaFileInfo[] = [];
    const errors: ScanError[] = [];
    const directoriesScanned: string[] = [];
    const yaraRulesMatched: string[] = [];

    let totalFilesScanned = 0;
    let safeFilesCount = 0;
    let skippedFilesCount = 0;
    let errorCount = 0;
    let apkFilesFound = 0;
    let riskyApkFiles = 0;

    try {
      // Stage 1: Initialization
      this.updateProgress({
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
        message: 'Initializing deep scan...'
      }, onProgress);

      // Initialize YARA engine if enabled
      if (fullConfig.enableYaraEngine) {
        await this.yaraService.initialize();
      }

      // Stage 2: Folder Scanning
      if (fullConfig.scanAllFolders) {
        this.updateProgress({
          stage: 'scanning_folders',
          message: 'Scanning all device folders...',
          percentage: 10
        }, onProgress);

        const folderScanResults = await this.folderScanner.scanAllFolders(
          {
            recursive: fullConfig.recursiveScan,
            maxDepth: fullConfig.maxScanDepth,
            scanApkFiles: fullConfig.scanApkFiles,
            scanSocialMediaFiles: fullConfig.scanSocialMediaFolders,
            riskThreshold: 40
          },
          (folderProgress) => {
            this.updateProgress({
              stage: 'scanning_folders',
              currentDirectory: folderProgress.currentFolder,
              currentFile: folderProgress.currentFile,
              filesScanned: folderProgress.filesScanned,
              totalFiles: folderProgress.totalFiles,
              threatsFound: folderProgress.threatsFound,
              percentage: 10 + (folderProgress.percentage * 0.4), // 10-50%
              message: `Scanning ${folderProgress.currentFolder}...`
            }, onProgress);
          }
        );

        // Process folder scan results
        for (const folderResult of folderScanResults.foldersScanned) {
          directoriesScanned.push(folderResult.folderPath);
          totalFilesScanned += folderResult.filesScanned;

          // Add risky files as threats
          for (const riskyFile of folderResult.riskyFiles) {
            threatsDetected.push({
              id: this.generateThreatId(),
              type: 'file',
              filePath: riskyFile.filePath,
              fileName: riskyFile.fileName,
              fileSize: riskyFile.fileSize,
              threatType: 'dangerous_file',
              threatName: `Risky file detected: ${riskyFile.fileName}`,
              severity: this.mapRiskLevelToSeverity(riskyFile.riskLevel),
              details: riskyFile.riskReasons.join(', '),
              description: `File with risk score ${riskyFile.riskScore}`,
              recommendations: ['Review file carefully', 'Consider deleting if not needed'],
              scanEngine: 'FolderScanner',
              detectedAt: new Date(),
              confidence: 75,
              falsePositiveRisk: 20,
              actions: this.generateThreatActions('file')
            });
          }

          // Add APK files
          apkFilesFound += folderResult.apkFiles.length;
          for (const apkFile of folderResult.apkFiles) {
            if (apkFile.riskScore >= 60) {
              riskyApkFiles++;
              threatsDetected.push({
                id: this.generateThreatId(),
                type: 'file',
                filePath: apkFile.filePath,
                fileName: apkFile.fileName,
                fileSize: apkFile.fileSize,
                threatType: 'suspicious_apk',
                threatName: `Risky APK: ${apkFile.packageName}`,
                severity: this.mapRiskLevelToSeverity(apkFile.riskLevel),
                details: `APK with risk score ${apkFile.riskScore}`,
                description: 'APK file with risky permissions detected',
                recommendations: ['Do not install', 'Delete if not from trusted source'],
                scanEngine: 'ApkAnalyzer',
                detectedAt: new Date(),
                confidence: 85,
                falsePositiveRisk: 15,
                actions: this.generateThreatActions('apk')
              });
            }
          }
        }
      }

      // Stage 3: Social Media Scanning
      if (fullConfig.scanSocialMediaFolders) {
        this.updateProgress({
          stage: 'scanning_social_media',
          message: 'Scanning social media files...',
          percentage: 50
        }, onProgress);

        const socialMediaResults = await this.socialMediaAnalyzer.scanAllSocialMedia();
        
        for (const threat of socialMediaResults.criticalThreats) {
          socialMediaThreats.push(threat);
          threatsDetected.push({
            id: this.generateThreatId(),
            type: 'file',
            filePath: threat.filePath,
            fileName: threat.fileName,
            fileSize: threat.fileSize,
            threatType: 'social_media_threat',
            threatName: `Risky file from ${threat.source}`,
            severity: this.mapRiskLevelToSeverity(threat.riskLevel),
            details: threat.riskReasons.join(', '),
            description: `Suspicious file downloaded via ${threat.source}`,
            recommendations: ['Review file source', 'Delete if suspicious'],
            scanEngine: 'SocialMediaAnalyzer',
            detectedAt: new Date(),
            confidence: 70,
            falsePositiveRisk: 25,
            actions: this.generateThreatActions('social_media')
          });
        }
      }

      // Stage 4: Complete
      this.updateProgress({
        stage: 'complete',
        percentage: 100,
        message: 'Scan complete!',
        threatsFound: threatsDetected.length
      }, onProgress);

      const scanEndTime = new Date();
      const scanDuration = scanEndTime.getTime() - this.scanStartTime.getTime();

      // Calculate statistics
      const statistics = this.calculateStatistics(threatsDetected, filesScanned);

      // Get device info
      const deviceInfo = await this.getDeviceInfo();

      const result: DeepScanResult = {
        scanId: this.currentScanId,
        success: true,
        scanStartTime: this.scanStartTime,
        scanEndTime,
        scanDuration,
        scanType: fullConfig.scanType,
        config: fullConfig,
        totalFilesScanned,
        filesScanned,
        threatsDetected,
        safeFilesCount,
        skippedFilesCount,
        errorCount,
        totalAppsScanned: appsScanned.length,
        appsScanned,
        riskyApps,
        socialMediaThreats,
        apkFilesFound,
        riskyApkFiles,
        directoriesScanned,
        directoriesWithThreats: this.getDirectoriesWithThreats(threatsDetected),
        scanEngineVersion: '2.0.0',
        isNativeYaraUsed: fullConfig.enableYaraEngine,
        yaraRulesMatched,
        deviceInfo,
        statistics,
        errors
      };

      // Add to history
      this.addToHistory(result);

      return result;

    } catch (error) {
      console.error('Deep scan error:', error);
      
      const scanEndTime = new Date();
      const scanDuration = this.scanStartTime 
        ? scanEndTime.getTime() - this.scanStartTime.getTime() 
        : 0;

      return {
        scanId: this.currentScanId || 'error',
        success: false,
        scanStartTime: this.scanStartTime || new Date(),
        scanEndTime,
        scanDuration,
        scanType: fullConfig.scanType,
        config: fullConfig,
        totalFilesScanned,
        filesScanned,
        threatsDetected,
        safeFilesCount,
        skippedFilesCount,
        errorCount: errorCount + 1,
        totalAppsScanned: 0,
        appsScanned: [],
        riskyApps: [],
        socialMediaThreats: [],
        apkFilesFound: 0,
        riskyApkFiles: 0,
        directoriesScanned,
        directoriesWithThreats: [],
        scanEngineVersion: '2.0.0',
        isNativeYaraUsed: false,
        yaraRulesMatched: [],
        deviceInfo: await this.getDeviceInfo(),
        statistics: this.calculateStatistics([], []),
        errors: [
          ...errors,
          {
            type: 'unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          }
        ]
      };
    } finally {
      this.isScanInProgress = false;
      this.currentScanId = null;
      this.currentProgress = null;
    }
  }

  /**
   * Cancel ongoing scan
   */
  public async cancelScan(): Promise<void> {
    if (!this.isScanInProgress) {
      return;
    }

    this.isCancelled = true;
    this.folderScanner.cancelScan();
  }

  /**
   * Pause ongoing scan
   */
  public async pauseScan(): Promise<void> {
    if (!this.isScanInProgress || this.isPaused) {
      return;
    }

    this.isPaused = true;
  }

  /**
   * Resume paused scan
   */
  public async resumeScan(): Promise<void> {
    if (!this.isScanInProgress || !this.isPaused) {
      return;
    }

    this.isPaused = false;
  }

  /**
   * Get current scan status
   */
  public getCurrentScanStatus(): DeepScanProgress | null {
    return this.currentProgress;
  }

  /**
   * Check if scan is in progress
   */
  public isScanningInProgress(): boolean {
    return this.isScanInProgress;
  }

  /**
   * Get scan history
   */
  public async getScanHistory(): Promise<DeepScanResult[]> {
    return [...this.scanHistory];
  }

  /**
   * Get specific scan result
   */
  public async getScanResult(scanId: string): Promise<DeepScanResult | null> {
    return this.scanHistory.find(r => r.scanId === scanId) || null;
  }

  /**
   * Clear scan history
   */
  public async clearScanHistory(): Promise<void> {
    this.scanHistory = [];
  }

  /**
   * Get default configuration
   */
  public getDefaultConfig(): DeepScanConfig {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Get quick scan configuration
   */
  public getQuickScanConfig(): DeepScanConfig {
    return { ...DEFAULT_CONFIG, ...QUICK_SCAN_CONFIG };
  }

  /**
   * Get full scan configuration
   */
  public getFullScanConfig(): DeepScanConfig {
    return { ...DEFAULT_CONFIG, ...FULL_SCAN_CONFIG };
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: Partial<DeepScanConfig>): boolean {
    // Basic validation
    if (config.maxFileSize && config.maxFileSize < 0) {
      return false;
    }
    if (config.maxScanDepth && config.maxScanDepth < 1) {
      return false;
    }
    return true;
  }

  /**
   * Get scan statistics
   */
  public getScanStatistics(): ScanStatistics {
    return {
      totalScans: this.scanHistory.length,
      lastScanDate: this.scanHistory.length > 0 
        ? this.scanHistory[this.scanHistory.length - 1].scanEndTime 
        : null,
      totalThreatsFound: this.scanHistory.reduce((sum, r) => sum + r.threatsDetected.length, 0),
      totalFilesScanned: this.scanHistory.reduce((sum, r) => sum + r.totalFilesScanned, 0),
      averageScanDuration: this.scanHistory.length > 0
        ? this.scanHistory.reduce((sum, r) => sum + r.scanDuration, 0) / this.scanHistory.length
        : 0
    };
  }

  /**
   * Get threat statistics
   */
  public getThreatStatistics(): ThreatStatistics {
    const allThreats = this.scanHistory.flatMap(r => r.threatsDetected);
    
    return {
      criticalThreats: allThreats.filter(t => t.severity === 'critical').length,
      highThreats: allThreats.filter(t => t.severity === 'high').length,
      mediumThreats: allThreats.filter(t => t.severity === 'medium').length,
      lowThreats: allThreats.filter(t => t.severity === 'low').length,
      malwareDetected: allThreats.filter(t => t.threatType === 'malware').length,
      suspiciousApks: allThreats.filter(t => t.threatType === 'suspicious_apk').length,
      riskyPermissions: allThreats.filter(t => t.threatType === 'risky_permissions').length
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Update progress
   */
  private updateProgress(
    progress: Partial<DeepScanProgress>,
    onProgress?: (progress: DeepScanProgress) => void
  ): void {
    const elapsedTime = this.scanStartTime 
      ? Date.now() - this.scanStartTime.getTime() 
      : 0;

    this.currentProgress = {
      ...this.currentProgress,
      ...progress,
      elapsedTime,
      estimatedTimeRemaining: this.estimateTimeRemaining(progress.percentage || 0, elapsedTime)
    } as DeepScanProgress;

    if (onProgress) {
      onProgress(this.currentProgress);
    }
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(percentage: number, elapsedTime: number): number {
    if (percentage === 0) return 0;
    const totalEstimated = (elapsedTime / percentage) * 100;
    return Math.max(0, totalEstimated - elapsedTime);
  }

  /**
   * Generate scan ID
   */
  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate threat ID
   */
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map risk level to severity
   */
  private mapRiskLevelToSeverity(riskLevel: RiskLevel): 'critical' | 'high' | 'medium' | 'low' {
    switch (riskLevel) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'low';
    }
  }

  /**
   * Generate threat actions
   */
  private generateThreatActions(threatType: string): ThreatAction[] {
    const actions: ThreatAction[] = [
      {
        action: 'view_details',
        label: 'View Details',
        description: 'View detailed information about this threat',
        isDestructive: false
      },
      {
        action: 'quarantine',
        label: 'Quarantine',
        description: 'Move file to quarantine',
        isDestructive: false
      },
      {
        action: 'delete',
        label: 'Delete',
        description: 'Permanently delete this file',
        isDestructive: true
      },
      {
        action: 'ignore',
        label: 'Ignore',
        description: 'Mark as safe and ignore',
        isDestructive: false
      }
    ];

    return actions;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(
    threats: DeepScanThreat[],
    files: ScannedFile[]
  ): DeepScanResult['statistics'] {
    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};

    for (const threat of threats) {
      threatsByType[threat.threatType] = (threatsByType[threat.threatType] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    }

    const scanTimes = files.map(f => f.scanTime).filter(t => t > 0);

    return {
      averageScanTimePerFile: scanTimes.length > 0 
        ? scanTimes.reduce((a, b) => a + b, 0) / scanTimes.length 
        : 0,
      fastestScanTime: scanTimes.length > 0 ? Math.min(...scanTimes) : 0,
      slowestScanTime: scanTimes.length > 0 ? Math.max(...scanTimes) : 0,
      threatsByType,
      threatsBySeverity
    };
  }

  /**
   * Get device info
   */
  private async getDeviceInfo(): Promise<DeepScanResult['deviceInfo']> {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();

      return {
        platform: Platform.OS,
        storageScanned: 0, // Would be calculated during scan
        totalStorage: totalSpace || 0,
        freeStorage: freeSpace || 0
      };
    } catch (error) {
      return {
        platform: Platform.OS,
        storageScanned: 0,
        totalStorage: 0,
        freeStorage: 0
      };
    }
  }

  /**
   * Get directories with threats
   */
  private getDirectoriesWithThreats(threats: DeepScanThreat[]): string[] {
    const dirs = new Set<string>();
    
    for (const threat of threats) {
      if (threat.filePath) {
        const dir = threat.filePath.substring(0, threat.filePath.lastIndexOf('/'));
        dirs.add(dir);
      }
    }

    return Array.from(dirs);
  }

  /**
   * Add result to history
   */
  private addToHistory(result: DeepScanResult): void {
    this.scanHistory.push(result);
    
    // Keep only last N scans
    if (this.scanHistory.length > this.maxHistorySize) {
      this.scanHistory = this.scanHistory.slice(-this.maxHistorySize);
    }
  }
}

// Export singleton instance
export default EnhancedDeepScanService.getInstance();
