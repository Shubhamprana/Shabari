/**
 * deepScan.types.ts
 * 
 * Comprehensive TypeScript type definitions for the Deep Scan feature.
 * Centralizes all interfaces and types used across the Deep Scan services.
 * 
 * @module deepScan.types
 * @author Shabari Security Team
 */

// ==================== ENUMS ====================

export enum ScanStage {
  INITIALIZING = 'initializing',
  PERMISSIONS = 'permissions',
  SCANNING_FILES = 'scanning_files',
  ANALYZING_APPS = 'analyzing_apps',
  ANALYZING_THREATS = 'analyzing_threats',
  SCANNING_FOLDERS = 'scanning_folders',
  SCANNING_SOCIAL_MEDIA = 'scanning_social_media',
  COMPLETE = 'complete',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum ThreatType {
  MALWARE = 'malware',
  SUSPICIOUS_APK = 'suspicious_apk',
  CORRUPTED_FILE = 'corrupted_file',
  DANGEROUS_FILE = 'dangerous_file',
  RISKY_PERMISSIONS = 'risky_permissions',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  SOCIAL_MEDIA_THREAT = 'social_media_threat',
  UNKNOWN = 'unknown'
}

export enum ThreatSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  SAFE = 'SAFE'
}

export enum ScanType {
  QUICK = 'quick',
  FULL = 'full',
  CUSTOM = 'custom'
}

export enum ScanPriority {
  SPEED = 'speed',
  BALANCED = 'balanced',
  THOROUGH = 'thorough'
}

export enum ThreatActionType {
  QUARANTINE = 'quarantine',
  DELETE = 'delete',
  IGNORE = 'ignore',
  SCAN_AGAIN = 'scan_again',
  VIEW_DETAILS = 'view_details'
}

export enum SocialMediaSource {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  OTHER = 'other'
}

export enum PermissionCategory {
  SYSTEM_CONTROL = 'SYSTEM_CONTROL',
  PRIVACY = 'PRIVACY',
  COMMUNICATION = 'COMMUNICATION',
  LOCATION = 'LOCATION',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  DEVICE_ADMIN = 'DEVICE_ADMIN',
  OTHER = 'OTHER'
}

export enum MaliciousPatternType {
  SPYWARE = 'spyware',
  TROJAN = 'trojan',
  ADWARE = 'adware',
  RANSOMWARE = 'ransomware',
  MINER = 'miner',
  KEYLOGGER = 'keylogger',
  BANKING = 'banking',
  OTHER = 'other'
}

export enum ScanErrorType {
  PERMISSION_DENIED = 'permission_denied',
  FILE_NOT_FOUND = 'file_not_found',
  SCAN_FAILED = 'scan_failed',
  UNKNOWN = 'unknown'
}

// ==================== CORE TYPES ====================

export type ProgressCallback = (progress: DeepScanProgress) => void;
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type RecommendedAction = 'safe' | 'scan' | 'quarantine' | 'delete' | 'warn' | 'uninstall' | 'review';

// ==================== INTERFACES ====================

/**
 * Deep Scan Progress
 */
export interface DeepScanProgress {
  stage: ScanStage | string;
  currentDirectory: string;
  currentFile: string;
  currentApp: string;
  filesScanned: number;
  totalFiles: number;
  appsScanned: number;
  totalApps: number;
  threatsFound: number;
  percentage: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  message: string;
  subStage?: string;
  currentThreat?: DeepScanThreat;
}

/**
 * Deep Scan Threat
 */
export interface DeepScanThreat {
  id: string;
  type: 'file' | 'app' | 'permission' | 'system';
  filePath?: string;
  appPackageName?: string;
  fileName: string;
  fileSize: number;
  threatType: ThreatType | string;
  threatName: string;
  severity: ThreatSeverity | string;
  details: string;
  description: string;
  recommendations: string[];
  scanEngine: string;
  detectedAt: Date;
  fileHash?: string;
  yaraRules?: string[];
  confidence: number;
  falsePositiveRisk: number;
  actions: ThreatAction[];
}

/**
 * Threat Action
 */
export interface ThreatAction {
  action: ThreatActionType | string;
  label: string;
  description: string;
  isDestructive: boolean;
}

/**
 * Deep Scan Configuration
 */
export interface DeepScanConfig {
  scanType: ScanType | string;
  
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
  maxFileSize: number;
  enableYaraEngine: boolean;
  enableHeuristicScan: boolean;
  enableAutoQuarantine: boolean;
  skipSystemFiles: boolean;
  skipHiddenFiles: boolean;
  recursiveScan: boolean;
  maxScanDepth: number;
  
  // Performance
  scanPriority: ScanPriority | string;
  maxConcurrentScans: number;
  batchSize: number;
  
  // Filters
  fileExtensions: string[];
  skipExtensions: string[];
  minFileSize: number;
}

/**
 * Deep Scan Result
 */
export interface DeepScanResult {
  scanId: string;
  success: boolean;
  scanStartTime: Date;
  scanEndTime: Date;
  scanDuration: number;
  scanType: ScanType | string;
  config: DeepScanConfig;
  
  totalFilesScanned: number;
  filesScanned: ScannedFile[];
  threatsDetected: DeepScanThreat[];
  safeFilesCount: number;
  skippedFilesCount: number;
  errorCount: number;
  
  totalAppsScanned: number;
  appsScanned: ScannedApp[];
  riskyApps: RiskyApp[];
  
  folderScanResults?: any;
  socialMediaThreats: any[];
  
  apkFilesFound: number;
  riskyApkFiles: number;
  
  directoriesScanned: string[];
  directoriesWithThreats: string[];
  
  scanEngineVersion: string;
  isNativeYaraUsed: boolean;
  yaraRulesMatched: string[];
  
  deviceInfo: DeviceInfo;
  statistics: ScanStatistics;
  errors: ScanError[];
}

/**
 * Scanned File
 */
export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  type: string;
  scanTime: number;
  isSafe: boolean;
  threatLevel: ThreatLevel;
  scanEngine: string;
}

/**
 * Scanned App
 */
export interface ScannedApp {
  packageName: string;
  appName: string;
  version: string;
  permissions: string[];
  riskyPermissions: string[];
  riskScore: number;
  isSafe: boolean;
  scanTime: number;
}

/**
 * Risky App
 */
export interface RiskyApp {
  packageName: string;
  appName: string;
  riskReasons: string[];
  riskScore: number;
  recommendedAction: RecommendedAction;
}

/**
 * Device Info
 */
export interface DeviceInfo {
  platform: string;
  storageScanned: number;
  totalStorage: number;
  freeStorage: number;
}

/**
 * Scan Statistics
 */
export interface ScanStatistics {
  averageScanTimePerFile: number;
  fastestScanTime: number;
  slowestScanTime: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
}

/**
 * Scan Error
 */
export interface ScanError {
  type: ScanErrorType | string;
  message: string;
  filePath?: string;
  timestamp: Date;
}

/**
 * Overall Scan Statistics
 */
export interface OverallScanStatistics {
  totalScans: number;
  lastScanDate: Date | null;
  totalThreatsFound: number;
  totalFilesScanned: number;
  averageScanDuration: number;
}

/**
 * Threat Statistics
 */
export interface ThreatStatistics {
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  malwareDetected: number;
  suspiciousApks: number;
  riskyPermissions: number;
}

// ==================== PERMISSION TYPES ====================

/**
 * Risky Permission
 */
export interface RiskyPermission {
  permission: string;
  riskLevel: RiskLevel;
  riskScore: number;
  category: PermissionCategory;
  description: string;
  whyRisky: string;
  examplesOfAbuse: string[];
}

/**
 * Permission Risk Assessment
 */
export interface PermissionRiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  riskyPermissions: RiskyPermission[];
  maliciousPatterns: MaliciousPattern[];
  recommendations: string[];
  riskReasons: string[];
}

/**
 * Malicious Pattern
 */
export interface MaliciousPattern {
  patternName: string;
  patternType: MaliciousPatternType | string;
  permissions: string[];
  description: string;
  severity: RiskLevel;
  examples: string[];
}

/**
 * Malicious Permission Result
 */
export interface MaliciousPermissionResult {
  isMalicious: boolean;
  maliciousScore: number;
  maliciousPatterns: MaliciousPattern[];
  suspiciousCombinations: string[];
  recommendedAction: string;
  confidence: number;
}

/**
 * Combination Risk
 */
export interface CombinationRisk {
  combination: string[];
  riskLevel: RiskLevel;
  riskScore: number;
  whyRisky: string;
  commonMalware: string[];
  recommendedAction: string;
}

// ==================== APK TYPES ====================

/**
 * APK Analysis
 */
export interface ApkAnalysis {
  apkPath: string;
  apkName: string;
  apkSize: number;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  riskAssessment: PermissionRiskAssessment;
  isSuspicious: boolean;
  suspiciousReasons: string[];
  analysisTimestamp: Date;
}

/**
 * APK Metadata
 */
export interface ApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  installLocation: string;
  applicationLabel: string;
  applicationIcon: string;
}

/**
 * APK Manifest
 */
export interface ApkManifest {
  packageName: string;
  versionName: string;
  versionCode: number;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  usesFeatures: string[];
  metadata: Record<string, string>;
}

/**
 * APK File
 */
export interface ApkFile {
  path: string;
  name: string;
  size: number;
  directory: string;
  lastModified: Date;
  analysis?: ApkAnalysis;
}

/**
 * APK Risk Assessment
 */
export interface ApkRiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  isMalicious: boolean;
  suspiciousCharacteristics: string[];
  recommendations: string[];
  permissionRisk: PermissionRiskAssessment;
}

// ==================== SOCIAL MEDIA TYPES ====================

/**
 * Social Media File Info
 */
export interface SocialMediaFileInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  source: SocialMediaSource | string;
  sourcePath: string;
  downloadDate: Date;
  isRisky: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
}

/**
 * Social Media File Analysis
 */
export interface SocialMediaFileAnalysis {
  filePath: string;
  fileName: string;
  source: SocialMediaSource | string;
  sourcePath: string;
  fileType: string;
  fileSize: number;
  downloadDate: Date;
  permissions: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  isRisky: boolean;
  riskReasons: string[];
  recommendedAction: RecommendedAction;
  analysisTimestamp: Date;
}

// ==================== FOLDER SCAN TYPES ====================

/**
 * Folder Scan Config
 */
export interface FolderScanConfig {
  recursive: boolean;
  maxDepth: number;
  scanApkFiles: boolean;
  scanSocialMediaFiles: boolean;
  checkFilePermissions: boolean;
  analyzeMetadata: boolean;
  riskThreshold: number;
  skipHiddenFiles: boolean;
  skipSystemFiles: boolean;
  maxFileSize: number;
}

/**
 * Risky File
 */
export interface RiskyFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  detectedAt: Date;
}

/**
 * Suspicious File
 */
export interface SuspiciousFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  suspiciousAttributes: string[];
}

/**
 * APK File Info
 */
export interface ApkFileInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  packageName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  hasRiskyPermissions: boolean;
  detectedAt: Date;
}

/**
 * Folder Scan Result
 */
export interface FolderScanResult {
  folderPath: string;
  folderName: string;
  totalFiles: number;
  filesScanned: number;
  riskyFiles: RiskyFile[];
  apkFiles: ApkFileInfo[];
  suspiciousFiles: SuspiciousFile[];
  socialMediaFiles: SocialMediaFileInfo[];
  scanDuration: number;
  scanTimestamp: Date;
}

/**
 * All Folders Scan Result
 */
export interface AllFoldersScanResult {
  foldersScanned: FolderScanResult[];
  totalFiles: number;
  totalRiskyFiles: number;
  totalApkFiles: number;
  totalSuspiciousFiles: number;
  criticalThreats: CriticalThreat[];
  scanDuration: number;
  scanTimestamp: Date;
}

/**
 * Critical Threat
 */
export interface CriticalThreat {
  type: 'apk' | 'executable' | 'suspicious' | 'malware';
  filePath: string;
  fileName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  description: string;
  recommendedAction: string;
}

/**
 * Folder Scan Progress
 */
export interface FolderScanProgress {
  currentFolder: string;
  currentFile: string;
  foldersScanned: number;
  totalFolders: number;
  filesScanned: number;
  totalFiles: number;
  threatsFound: number;
  percentage: number;
  message: string;
}

// ==================== UI COMPONENT TYPES ====================

/**
 * Threat Card Props
 */
export interface ThreatCardProps {
  threat: DeepScanThreat;
  onAction: (action: ThreatActionType, threat: DeepScanThreat) => void;
  expanded?: boolean;
}

/**
 * Progress Card Props
 */
export interface ProgressCardProps {
  progress: DeepScanProgress;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * Statistics Card Props
 */
export interface StatisticsCardProps {
  result: DeepScanResult;
}

/**
 * Config Panel Props
 */
export interface ConfigPanelProps {
  config: DeepScanConfig;
  onChange: (config: DeepScanConfig) => void;
}

/**
 * Result Summary Props
 */
export interface ResultSummaryProps {
  result: DeepScanResult;
  onViewThreat: (threat: DeepScanThreat) => void;
  onExport?: () => void;
}

// ==================== STORE TYPES ====================

/**
 * Deep Scan Store State
 */
export interface DeepScanStoreState {
  isScanning: boolean;
  isPaused: boolean;
  currentProgress: DeepScanProgress | null;
  currentResult: DeepScanResult | null;
  scanHistory: DeepScanResult[];
  config: DeepScanConfig;
  
  // Actions
  startScan: (config: DeepScanConfig) => void;
  updateProgress: (progress: DeepScanProgress) => void;
  completeScan: (result: DeepScanResult) => void;
  cancelScan: () => void;
  pauseScan: () => void;
  resumeScan: () => void;
  setConfig: (config: DeepScanConfig) => void;
  addToHistory: (result: DeepScanResult) => void;
  clearHistory: () => void;
}

// ==================== EXPORT ALL ====================

export type {
  ProgressCallback,
  ThreatLevel,
  RecommendedAction
};
