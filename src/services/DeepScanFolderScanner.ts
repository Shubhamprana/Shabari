/**
 * DeepScanFolderScanner.ts
 * 
 * Comprehensive folder-wide scanning service that scans all device folders
 * including Downloads, WhatsApp, Telegram, and other social media folders.
 * 
 * @module DeepScanFolderScanner
 * @author Shabari Security Team
 */

import * as FileSystem from 'expo-file-system';
import DeepScanPermissionAnalyzer, { RiskLevel } from './DeepScanPermissionAnalyzer';
import DeepScanApkAnalyzer, { ApkFile } from './DeepScanApkAnalyzer';
import DeepScanSocialMediaAnalyzer, { SocialMediaFileInfo, SocialMediaSource } from './DeepScanSocialMediaAnalyzer';

// ==================== TYPES ====================

export interface FolderScanConfig {
  recursive: boolean;
  maxDepth: number;
  scanApkFiles: boolean;
  scanSocialMediaFiles: boolean;
  checkFilePermissions: boolean;
  analyzeMetadata: boolean;
  riskThreshold: number; // 0-100
  skipHiddenFiles: boolean;
  skipSystemFiles: boolean;
  maxFileSize: number; // bytes, 0 = no limit
}

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

export interface SuspiciousFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  suspiciousAttributes: string[];
}

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

export interface CriticalThreat {
  type: 'apk' | 'executable' | 'suspicious' | 'malware';
  filePath: string;
  fileName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  description: string;
  recommendedAction: string;
}

export type ProgressCallback = (progress: FolderScanProgress) => void;

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

// ==================== CONSTANTS ====================

const FOLDERS_TO_SCAN = [
  // Downloads
  {
    path: '/storage/emulated/0/Download',
    name: 'Download',
    priority: 'high' as const,
    category: 'downloads' as const
  },
  {
    path: '/storage/emulated/0/Downloads',
    name: 'Downloads',
    priority: 'high' as const,
    category: 'downloads' as const
  },
  
  // DCIM (Camera)
  {
    path: '/storage/emulated/0/DCIM',
    name: 'DCIM',
    priority: 'medium' as const,
    category: 'media' as const
  },
  
  // WhatsApp
  {
    path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Images',
    name: 'WhatsApp Images',
    priority: 'high' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Video',
    name: 'WhatsApp Video',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio',
    name: 'WhatsApp Audio',
    priority: 'low' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
    name: 'WhatsApp Documents',
    priority: 'high' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Animated Gifs',
    name: 'WhatsApp GIFs',
    priority: 'low' as const,
    category: 'social_media' as const
  },
  
  // Telegram
  {
    path: '/storage/emulated/0/Telegram/Telegram Images',
    name: 'Telegram Images',
    priority: 'high' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Telegram/Telegram Video',
    name: 'Telegram Video',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Telegram/Telegram Audio',
    name: 'Telegram Audio',
    priority: 'low' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Telegram/Telegram Documents',
    name: 'Telegram Documents',
    priority: 'high' as const,
    category: 'social_media' as const
  },
  
  // Instagram
  {
    path: '/storage/emulated/0/Android/media/com.instagram.android/Instagram',
    name: 'Instagram',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Pictures/Instagram',
    name: 'Instagram Pictures',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  
  // Facebook
  {
    path: '/storage/emulated/0/Android/media/com.facebook.katana/Facebook',
    name: 'Facebook',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Pictures/Facebook',
    name: 'Facebook Pictures',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  
  // Twitter
  {
    path: '/storage/emulated/0/Android/media/com.twitter.android/Twitter',
    name: 'Twitter',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  {
    path: '/storage/emulated/0/Pictures/Twitter',
    name: 'Twitter Pictures',
    priority: 'medium' as const,
    category: 'social_media' as const
  },
  
  // Documents
  {
    path: '/storage/emulated/0/Documents',
    name: 'Documents',
    priority: 'high' as const,
    category: 'documents' as const
  },
  {
    path: '/storage/emulated/0/MyFiles',
    name: 'My Files',
    priority: 'medium' as const,
    category: 'documents' as const
  },
  
  // APK Files
  {
    path: '/storage/emulated/0/APK',
    name: 'APK',
    priority: 'critical' as const,
    category: 'apk' as const
  },
  {
    path: '/storage/emulated/0/Download/APK',
    name: 'Download APK',
    priority: 'critical' as const,
    category: 'apk' as const
  },
  
  // Android Data (Cache)
  {
    path: '/storage/emulated/0/Android/data',
    name: 'Android Data',
    priority: 'low' as const,
    category: 'system' as const
  },
];

const RISKY_FILE_EXTENSIONS = [
  '.apk', '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js',
  '.jar', '.dex', '.so', '.zip', '.rar', '.7z'
];

const SUSPICIOUS_PATTERNS = [
  /crack/i, /hack/i, /keygen/i, /patch/i, /mod/i, /cheat/i,
  /trojan/i, /malware/i, /virus/i, /ransomware/i
];

// ==================== CLASS ====================

/**
 * DeepScanFolderScanner
 * 
 * Comprehensive folder scanning service that coordinates with permission analyzer,
 * APK analyzer, and social media analyzer to provide complete device scanning.
 */
export class DeepScanFolderScanner {
  private static instance: DeepScanFolderScanner;
  private permissionAnalyzer: typeof DeepScanPermissionAnalyzer;
  private apkAnalyzer: typeof DeepScanApkAnalyzer;
  private socialMediaAnalyzer: typeof DeepScanSocialMediaAnalyzer;
  private isCancelled: boolean = false;

  private constructor() {
    this.permissionAnalyzer = DeepScanPermissionAnalyzer;
    this.apkAnalyzer = DeepScanApkAnalyzer;
    this.socialMediaAnalyzer = DeepScanSocialMediaAnalyzer;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DeepScanFolderScanner {
    if (!DeepScanFolderScanner.instance) {
      DeepScanFolderScanner.instance = new DeepScanFolderScanner();
    }
    return DeepScanFolderScanner.instance;
  }

  /**
   * Scan a single folder
   */
  public async scanFolder(
    folderPath: string,
    config: Partial<FolderScanConfig> = {},
    onProgress?: ProgressCallback
  ): Promise<FolderScanResult> {
    const startTime = Date.now();
    const fullConfig = this.getDefaultConfig(config);
    
    const folderName = folderPath.split('/').pop() || 'Unknown';
    const riskyFiles: RiskyFile[] = [];
    const apkFiles: ApkFileInfo[] = [];
    const suspiciousFiles: SuspiciousFile[] = [];
    const socialMediaFiles: SocialMediaFileInfo[] = [];
    
    let totalFiles = 0;
    let filesScanned = 0;

    try {
      // Check if folder exists
      const dirInfo = await FileSystem.getInfoAsync(folderPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        console.log(`Folder not found or not a directory: ${folderPath}`);
        return this.createEmptyResult(folderPath, folderName);
      }

      // Count total files first
      totalFiles = await this.countFiles(folderPath, fullConfig, 0);

      // Scan files
      await this.scanFolderRecursive(
        folderPath,
        fullConfig,
        0,
        riskyFiles,
        apkFiles,
        suspiciousFiles,
        socialMediaFiles,
        (current) => {
          filesScanned = current;
          if (onProgress) {
            onProgress({
              currentFolder: folderPath,
              currentFile: '',
              foldersScanned: 1,
              totalFolders: 1,
              filesScanned,
              totalFiles,
              threatsFound: riskyFiles.length + apkFiles.length,
              percentage: totalFiles > 0 ? (filesScanned / totalFiles) * 100 : 0,
              message: `Scanning ${folderName}...`
            });
          }
        }
      );

    } catch (error) {
      console.error(`Error scanning folder ${folderPath}:`, error);
    }

    const scanDuration = Date.now() - startTime;

    return {
      folderPath,
      folderName,
      totalFiles,
      filesScanned,
      riskyFiles,
      apkFiles,
      suspiciousFiles,
      socialMediaFiles,
      scanDuration,
      scanTimestamp: new Date()
    };
  }

  /**
   * Scan all predefined folders
   */
  public async scanAllFolders(
    config: Partial<FolderScanConfig> = {},
    onProgress?: ProgressCallback
  ): Promise<AllFoldersScanResult> {
    const startTime = Date.now();
    this.isCancelled = false;
    
    const foldersScanned: FolderScanResult[] = [];
    let totalFiles = 0;
    let totalRiskyFiles = 0;
    let totalApkFiles = 0;
    let totalSuspiciousFiles = 0;
    const criticalThreats: CriticalThreat[] = [];

    const totalFolders = FOLDERS_TO_SCAN.length;

    for (let i = 0; i < FOLDERS_TO_SCAN.length; i++) {
      if (this.isCancelled) {
        break;
      }

      const folder = FOLDERS_TO_SCAN[i];
      
      try {
        if (onProgress) {
          onProgress({
            currentFolder: folder.name,
            currentFile: '',
            foldersScanned: i,
            totalFolders,
            filesScanned: 0,
            totalFiles: 0,
            threatsFound: totalRiskyFiles + totalApkFiles,
            percentage: (i / totalFolders) * 100,
            message: `Scanning ${folder.name}...`
          });
        }

        const result = await this.scanFolder(folder.path, config);
        foldersScanned.push(result);

        totalFiles += result.totalFiles;
        totalRiskyFiles += result.riskyFiles.length;
        totalApkFiles += result.apkFiles.length;
        totalSuspiciousFiles += result.suspiciousFiles.length;

        // Collect critical threats
        for (const riskyFile of result.riskyFiles) {
          if (riskyFile.riskLevel === 'CRITICAL') {
            criticalThreats.push({
              type: 'malware',
              filePath: riskyFile.filePath,
              fileName: riskyFile.fileName,
              riskScore: riskyFile.riskScore,
              riskLevel: riskyFile.riskLevel,
              description: riskyFile.riskReasons.join(', '),
              recommendedAction: 'Delete immediately'
            });
          }
        }

        for (const apkFile of result.apkFiles) {
          if (apkFile.riskLevel === 'CRITICAL' || apkFile.riskLevel === 'HIGH') {
            criticalThreats.push({
              type: 'apk',
              filePath: apkFile.filePath,
              fileName: apkFile.fileName,
              riskScore: apkFile.riskScore,
              riskLevel: apkFile.riskLevel,
              description: `APK file with ${apkFile.riskLevel} risk`,
              recommendedAction: 'Do not install - Delete file'
            });
          }
        }

      } catch (error) {
        console.error(`Error scanning ${folder.name}:`, error);
      }
    }

    const scanDuration = Date.now() - startTime;

    return {
      foldersScanned,
      totalFiles,
      totalRiskyFiles,
      totalApkFiles,
      totalSuspiciousFiles,
      criticalThreats,
      scanDuration,
      scanTimestamp: new Date()
    };
  }

  /**
   * Cancel ongoing scan
   */
  public cancelScan(): void {
    this.isCancelled = true;
  }

  /**
   * Get default scan configuration
   */
  public getDefaultConfig(partial: Partial<FolderScanConfig> = {}): FolderScanConfig {
    return {
      recursive: true,
      maxDepth: 5,
      scanApkFiles: true,
      scanSocialMediaFiles: true,
      checkFilePermissions: true,
      analyzeMetadata: true,
      riskThreshold: 40,
      skipHiddenFiles: true,
      skipSystemFiles: true,
      maxFileSize: 0, // No limit
      ...partial
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Scan folder recursively
   */
  private async scanFolderRecursive(
    folderPath: string,
    config: FolderScanConfig,
    depth: number,
    riskyFiles: RiskyFile[],
    apkFiles: ApkFileInfo[],
    suspiciousFiles: SuspiciousFile[],
    socialMediaFiles: SocialMediaFileInfo[],
    onFileScanned: (count: number) => void
  ): Promise<void> {
    if (this.isCancelled || depth > config.maxDepth) {
      return;
    }

    try {
      const files = await FileSystem.readDirectoryAsync(folderPath);

      for (const file of files) {
        if (this.isCancelled) {
          break;
        }

        const filePath = `${folderPath}/${file}`;

        // Skip hidden files if configured
        if (config.skipHiddenFiles && file.startsWith('.')) {
          continue;
        }

        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.isDirectory) {
            // Recursively scan subdirectory
            if (config.recursive) {
              await this.scanFolderRecursive(
                filePath,
                config,
                depth + 1,
                riskyFiles,
                apkFiles,
                suspiciousFiles,
                socialMediaFiles,
                onFileScanned
              );
            }
          } else {
            // Analyze file
            await this.analyzeFile(
              filePath,
              file,
              fileInfo.size || 0,
              config,
              riskyFiles,
              apkFiles,
              suspiciousFiles
            );

            onFileScanned(riskyFiles.length + apkFiles.length + suspiciousFiles.length);
          }
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${folderPath}:`, error);
    }
  }

  /**
   * Analyze individual file
   */
  private async analyzeFile(
    filePath: string,
    fileName: string,
    fileSize: number,
    config: FolderScanConfig,
    riskyFiles: RiskyFile[],
    apkFiles: ApkFileInfo[],
    suspiciousFiles: SuspiciousFile[]
  ): Promise<void> {
    // Check file size limit
    if (config.maxFileSize > 0 && fileSize > config.maxFileSize) {
      return;
    }

    const fileType = this.getFileType(fileName);
    let riskScore = 0;
    const riskReasons: string[] = [];

    // Check for risky file extensions
    if (RISKY_FILE_EXTENSIONS.includes(`.${fileType}`)) {
      riskScore += 40;
      riskReasons.push(`Risky file type: .${fileType}`);
    }

    // Check for suspicious filename patterns
    if (this.hasSuspiciousName(fileName)) {
      riskScore += 30;
      riskReasons.push('Suspicious filename pattern');
    }

    // Special handling for APK files
    if (fileType === 'apk' && config.scanApkFiles) {
      try {
        const apkAnalysis = await this.apkAnalyzer.analyzeApk(filePath);
        const apkRiskScore = this.apkAnalyzer.calculateApkRiskScore(apkAnalysis);

        apkFiles.push({
          filePath,
          fileName,
          fileSize,
          packageName: apkAnalysis.packageName,
          riskScore: apkRiskScore,
          riskLevel: this.calculateRiskLevel(apkRiskScore),
          hasRiskyPermissions: apkAnalysis.riskAssessment.riskyPermissions.length > 0,
          detectedAt: new Date()
        });

        // Also add to risky files if score is high
        if (apkRiskScore >= config.riskThreshold) {
          riskyFiles.push({
            filePath,
            fileName,
            fileSize,
            fileType,
            riskScore: apkRiskScore,
            riskLevel: this.calculateRiskLevel(apkRiskScore),
            riskReasons: [`APK with risk score ${apkRiskScore}`, ...apkAnalysis.suspiciousReasons],
            detectedAt: new Date()
          });
        }
      } catch (error) {
        console.error(`Error analyzing APK ${fileName}:`, error);
      }
    }

    // Add to risky files if above threshold
    if (riskScore >= config.riskThreshold) {
      riskyFiles.push({
        filePath,
        fileName,
        fileSize,
        fileType,
        riskScore,
        riskLevel: this.calculateRiskLevel(riskScore),
        riskReasons,
        detectedAt: new Date()
      });
    }

    // Add to suspicious files if has suspicious attributes
    if (riskReasons.length > 0 && riskScore < config.riskThreshold) {
      suspiciousFiles.push({
        filePath,
        fileName,
        fileSize,
        fileType,
        fileHash: '', // Would be calculated in production
        suspiciousAttributes: riskReasons
      });
    }
  }

  /**
   * Count total files in folder
   */
  private async countFiles(folderPath: string, config: FolderScanConfig, depth: number): Promise<number> {
    if (depth > config.maxDepth) {
      return 0;
    }

    let count = 0;

    try {
      const dirInfo = await FileSystem.getInfoAsync(folderPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return 0;
      }

      const files = await FileSystem.readDirectoryAsync(folderPath);

      for (const file of files) {
        if (config.skipHiddenFiles && file.startsWith('.')) {
          continue;
        }

        const filePath = `${folderPath}/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.isDirectory) {
          if (config.recursive) {
            count += await this.countFiles(filePath, config, depth + 1);
          }
        } else {
          count++;
        }
      }
    } catch (error) {
      // Silently fail for inaccessible folders
    }

    return count;
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if filename has suspicious patterns
   */
  private hasSuspiciousName(fileName: string): boolean {
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(fileName));
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'SAFE';
  }

  /**
   * Create empty scan result
   */
  private createEmptyResult(folderPath: string, folderName: string): FolderScanResult {
    return {
      folderPath,
      folderName,
      totalFiles: 0,
      filesScanned: 0,
      riskyFiles: [],
      apkFiles: [],
      suspiciousFiles: [],
      socialMediaFiles: [],
      scanDuration: 0,
      scanTimestamp: new Date()
    };
  }
}

// Export singleton instance
export default DeepScanFolderScanner.getInstance();
