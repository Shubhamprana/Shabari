/**
 * DeepScanSocialMediaAnalyzer.ts
 * 
 * Analyzes files from social media apps (WhatsApp, Telegram, Instagram, Facebook)
 * for security risks, malicious content, and suspicious downloads.
 * 
 * @module DeepScanSocialMediaAnalyzer
 * @author Shabari Security Team
 */

import * as FileSystem from 'expo-file-system';
import { RiskLevel } from './DeepScanPermissionAnalyzer';

// ==================== TYPES ====================

export type SocialMediaSource = 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'twitter' | 'other';

export interface SocialMediaFileInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  source: SocialMediaSource;
  sourcePath: string;
  downloadDate: Date;
  isRisky: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
}

export interface SocialMediaFileAnalysis {
  filePath: string;
  fileName: string;
  source: SocialMediaSource;
  sourcePath: string;
  fileType: string;
  fileSize: number;
  downloadDate: Date;
  permissions: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  isRisky: boolean;
  riskReasons: string[];
  recommendedAction: 'safe' | 'scan' | 'quarantine' | 'delete';
  analysisTimestamp: Date;
}

export interface SocialMediaScanResult {
  source: SocialMediaSource;
  totalFiles: number;
  riskyFiles: SocialMediaFileInfo[];
  apkFiles: SocialMediaFileInfo[];
  executableFiles: SocialMediaFileInfo[];
  suspiciousFiles: SocialMediaFileInfo[];
  scanDuration: number;
  scanTimestamp: Date;
}

export interface AllSocialMediaScanResult {
  whatsapp: SocialMediaScanResult | null;
  telegram: SocialMediaScanResult | null;
  instagram: SocialMediaScanResult | null;
  facebook: SocialMediaScanResult | null;
  twitter: SocialMediaScanResult | null;
  totalRiskyFiles: number;
  criticalThreats: SocialMediaFileInfo[];
  scanDuration: number;
  scanTimestamp: Date;
}

// ==================== CONSTANTS ====================

const SOCIAL_MEDIA_PATHS: Record<SocialMediaSource, string[]> = {
  whatsapp: [
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Images',
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Video',
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio',
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Animated Gifs',
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Voice Notes',
  ],
  telegram: [
    '/storage/emulated/0/Telegram/Telegram Images',
    '/storage/emulated/0/Telegram/Telegram Video',
    '/storage/emulated/0/Telegram/Telegram Audio',
    '/storage/emulated/0/Telegram/Telegram Documents',
  ],
  instagram: [
    '/storage/emulated/0/Android/media/com.instagram.android/Instagram',
    '/storage/emulated/0/Pictures/Instagram',
  ],
  facebook: [
    '/storage/emulated/0/Android/media/com.facebook.katana/Facebook',
    '/storage/emulated/0/Pictures/Facebook',
  ],
  twitter: [
    '/storage/emulated/0/Android/media/com.twitter.android/Twitter',
    '/storage/emulated/0/Pictures/Twitter',
  ],
  other: []
};

const RISKY_FILE_EXTENSIONS = [
  '.apk',      // Android packages
  '.exe',      // Windows executables
  '.bat',      // Batch files
  '.cmd',      // Command files
  '.com',      // DOS executables
  '.scr',      // Screen savers (often malware)
  '.vbs',      // VBScript
  '.js',       // JavaScript (can be malicious)
  '.jar',      // Java archives
  '.dex',      // Dalvik executables
  '.so',       // Native libraries
  '.zip',      // Compressed (may contain malware)
  '.rar',      // Compressed
  '.7z',       // Compressed
  '.tar',      // Compressed
  '.gz',       // Compressed
];

const SUSPICIOUS_FILENAME_PATTERNS = [
  /crack/i,
  /hack/i,
  /keygen/i,
  /patch/i,
  /mod/i,
  /cheat/i,
  /free.*premium/i,
  /unlock/i,
  /bypass/i,
  /trojan/i,
  /malware/i,
  /virus/i,
  /ransomware/i,
  /spyware/i,
];

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100 MB
const VERY_LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500 MB

// ==================== CLASS ====================

/**
 * DeepScanSocialMediaAnalyzer
 * 
 * Analyzes files downloaded through social media apps to detect
 * malicious content and security risks.
 */
export class DeepScanSocialMediaAnalyzer {
  private static instance: DeepScanSocialMediaAnalyzer;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DeepScanSocialMediaAnalyzer {
    if (!DeepScanSocialMediaAnalyzer.instance) {
      DeepScanSocialMediaAnalyzer.instance = new DeepScanSocialMediaAnalyzer();
    }
    return DeepScanSocialMediaAnalyzer.instance;
  }

  /**
   * Analyze a social media file
   */
  public async analyzeSocialMediaFile(filePath: string, source: SocialMediaSource): Promise<SocialMediaFileAnalysis> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = filePath.split('/').pop() || 'unknown';
      const fileSize = fileInfo.size || 0;
      const fileType = this.getFileType(fileName);
      const downloadDate = new Date(fileInfo.modificationTime || Date.now());
      const sourcePath = filePath.substring(0, filePath.lastIndexOf('/'));

      // Calculate risk score
      const { riskScore, riskReasons } = this.calculateFileRisk(fileName, fileSize, fileType);
      const riskLevel = this.calculateRiskLevel(riskScore);
      const isRisky = riskScore >= 40;
      const recommendedAction = this.getRecommendedAction(riskScore, fileType);

      return {
        filePath,
        fileName,
        source,
        sourcePath,
        fileType,
        fileSize,
        downloadDate,
        permissions: [], // Would be populated for APK files
        riskScore,
        riskLevel,
        isRisky,
        riskReasons,
        recommendedAction,
        analysisTimestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing social media file:', error);
      throw error;
    }
  }

  /**
   * Scan social media folder
   */
  public async scanSocialMediaFolder(
    source: SocialMediaSource,
    folderPath: string
  ): Promise<SocialMediaFileInfo[]> {
    const files: SocialMediaFileInfo[] = [];

    try {
      const dirInfo = await FileSystem.getInfoAsync(folderPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return files;
      }

      const fileList = await FileSystem.readDirectoryAsync(folderPath);

      for (const file of fileList) {
        try {
          const filePath = `${folderPath}/${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.isDirectory) {
            // Recursively scan subdirectories
            const subFiles = await this.scanSocialMediaFolder(source, filePath);
            files.push(...subFiles);
          } else {
            const fileName = file;
            const fileSize = fileInfo.size || 0;
            const fileType = this.getFileType(fileName);
            const downloadDate = new Date(fileInfo.modificationTime || Date.now());

            const { riskScore, riskReasons } = this.calculateFileRisk(fileName, fileSize, fileType);
            const riskLevel = this.calculateRiskLevel(riskScore);
            const isRisky = riskScore >= 40;

            files.push({
              filePath,
              fileName,
              fileSize,
              fileType,
              source,
              sourcePath: folderPath,
              downloadDate,
              isRisky,
              riskScore,
              riskLevel,
              riskReasons
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${folderPath}:`, error);
    }

    return files;
  }

  /**
   * Scan all folders for a social media source
   */
  public async scanSocialMediaSource(source: SocialMediaSource): Promise<SocialMediaScanResult> {
    const startTime = Date.now();
    const allFiles: SocialMediaFileInfo[] = [];

    const paths = SOCIAL_MEDIA_PATHS[source] || [];

    for (const path of paths) {
      try {
        const files = await this.scanSocialMediaFolder(source, path);
        allFiles.push(...files);
      } catch (error) {
        console.log(`Skipping ${path}:`, error);
      }
    }

    // Categorize files
    const riskyFiles = allFiles.filter(f => f.isRisky);
    const apkFiles = allFiles.filter(f => f.fileType === 'apk');
    const executableFiles = allFiles.filter(f => this.isExecutable(f.fileType));
    const suspiciousFiles = allFiles.filter(f => 
      this.hasSuspiciousName(f.fileName) || f.riskScore >= 30
    );

    const scanDuration = Date.now() - startTime;

    return {
      source,
      totalFiles: allFiles.length,
      riskyFiles,
      apkFiles,
      executableFiles,
      suspiciousFiles,
      scanDuration,
      scanTimestamp: new Date()
    };
  }

  /**
   * Scan all social media sources
   */
  public async scanAllSocialMedia(): Promise<AllSocialMediaScanResult> {
    const startTime = Date.now();

    const [whatsapp, telegram, instagram, facebook, twitter] = await Promise.all([
      this.scanSocialMediaSource('whatsapp').catch(() => null),
      this.scanSocialMediaSource('telegram').catch(() => null),
      this.scanSocialMediaSource('instagram').catch(() => null),
      this.scanSocialMediaSource('facebook').catch(() => null),
      this.scanSocialMediaSource('twitter').catch(() => null),
    ]);

    // Collect all risky files
    const allRiskyFiles: SocialMediaFileInfo[] = [];
    const criticalThreats: SocialMediaFileInfo[] = [];

    for (const result of [whatsapp, telegram, instagram, facebook, twitter]) {
      if (result) {
        allRiskyFiles.push(...result.riskyFiles);
        criticalThreats.push(...result.riskyFiles.filter(f => f.riskLevel === 'CRITICAL'));
      }
    }

    const scanDuration = Date.now() - startTime;

    return {
      whatsapp,
      telegram,
      instagram,
      facebook,
      twitter,
      totalRiskyFiles: allRiskyFiles.length,
      criticalThreats,
      scanDuration,
      scanTimestamp: new Date()
    };
  }

  /**
   * Get risky files from WhatsApp
   */
  public async getRiskyWhatsAppFiles(): Promise<SocialMediaFileInfo[]> {
    const result = await this.scanSocialMediaSource('whatsapp');
    return result.riskyFiles;
  }

  /**
   * Get risky files from Telegram
   */
  public async getRiskyTelegramFiles(): Promise<SocialMediaFileInfo[]> {
    const result = await this.scanSocialMediaSource('telegram');
    return result.riskyFiles;
  }

  /**
   * Get all APK files from social media
   */
  public async getAllSocialMediaApks(): Promise<SocialMediaFileInfo[]> {
    const result = await this.scanAllSocialMedia();
    const apkFiles: SocialMediaFileInfo[] = [];

    for (const sourceResult of [result.whatsapp, result.telegram, result.instagram, result.facebook, result.twitter]) {
      if (sourceResult) {
        apkFiles.push(...sourceResult.apkFiles);
      }
    }

    return apkFiles;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  /**
   * Calculate file risk score
   */
  private calculateFileRisk(fileName: string, fileSize: number, fileType: string): {
    riskScore: number;
    riskReasons: string[];
  } {
    let riskScore = 0;
    const riskReasons: string[] = [];

    // Check file extension
    if (RISKY_FILE_EXTENSIONS.includes(`.${fileType}`)) {
      riskScore += 40;
      riskReasons.push(`Risky file type: .${fileType}`);
    }

    // Check for APK files (highest risk)
    if (fileType === 'apk') {
      riskScore += 30;
      riskReasons.push('APK file from social media - high malware risk');
    }

    // Check for executable files
    if (this.isExecutable(fileType)) {
      riskScore += 35;
      riskReasons.push('Executable file - potential malware');
    }

    // Check for compressed files
    if (this.isCompressed(fileType)) {
      riskScore += 15;
      riskReasons.push('Compressed file - may contain hidden malware');
    }

    // Check filename patterns
    if (this.hasSuspiciousName(fileName)) {
      riskScore += 25;
      riskReasons.push('Suspicious filename pattern detected');
    }

    // Check file size
    if (fileSize > VERY_LARGE_FILE_THRESHOLD) {
      riskScore += 15;
      riskReasons.push(`Very large file (${this.formatFileSize(fileSize)}) - unusual for social media`);
    } else if (fileSize > LARGE_FILE_THRESHOLD) {
      riskScore += 10;
      riskReasons.push(`Large file (${this.formatFileSize(fileSize)})`);
    }

    // Check for zero-byte files (suspicious)
    if (fileSize === 0) {
      riskScore += 20;
      riskReasons.push('Zero-byte file - may be corrupted or malicious');
    }

    return {
      riskScore: Math.min(100, riskScore),
      riskReasons
    };
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
   * Get recommended action
   */
  private getRecommendedAction(riskScore: number, fileType: string): 'safe' | 'scan' | 'quarantine' | 'delete' {
    if (riskScore >= 80 || fileType === 'apk') {
      return 'delete';
    } else if (riskScore >= 60) {
      return 'quarantine';
    } else if (riskScore >= 30) {
      return 'scan';
    } else {
      return 'safe';
    }
  }

  /**
   * Check if file is executable
   */
  private isExecutable(fileType: string): boolean {
    const executableTypes = ['apk', 'exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js', 'jar', 'dex', 'so'];
    return executableTypes.includes(fileType);
  }

  /**
   * Check if file is compressed
   */
  private isCompressed(fileType: string): boolean {
    const compressedTypes = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    return compressedTypes.includes(fileType);
  }

  /**
   * Check if filename has suspicious patterns
   */
  private hasSuspiciousName(fileName: string): boolean {
    return SUSPICIOUS_FILENAME_PATTERNS.some(pattern => pattern.test(fileName));
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// Export singleton instance
export default DeepScanSocialMediaAnalyzer.getInstance();
