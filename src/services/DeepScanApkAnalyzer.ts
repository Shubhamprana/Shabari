/**
 * DeepScanApkAnalyzer.ts
 * 
 * Analyzes APK files for permissions, metadata, and suspicious behavior.
 * Extracts and analyzes AndroidManifest.xml from APK files.
 * 
 * @module DeepScanApkAnalyzer
 * @author Shabari Security Team
 */

import * as FileSystem from 'expo-file-system';
import DeepScanPermissionAnalyzer, { RiskLevel, PermissionRiskAssessment } from './DeepScanPermissionAnalyzer';

// ==================== TYPES ====================

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

export interface ApkFile {
  path: string;
  name: string;
  size: number;
  directory: string;
  lastModified: Date;
  analysis?: ApkAnalysis;
}

export interface ApkRiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  isMalicious: boolean;
  suspiciousCharacteristics: string[];
  recommendations: string[];
  permissionRisk: PermissionRiskAssessment;
}

export interface ApkScanResult {
  totalApkFiles: number;
  apkFiles: ApkFile[];
  riskyApkFiles: ApkFile[];
  maliciousApkFiles: ApkFile[];
  scanDuration: number;
  scanTimestamp: Date;
}

// ==================== CONSTANTS ====================

const APK_SUSPICIOUS_INDICATORS = {
  // Suspicious package name patterns
  SUSPICIOUS_PACKAGE_PATTERNS: [
    /\.test\./,
    /\.debug\./,
    /\.fake\./,
    /\.crack\./,
    /\.mod\./,
    /\.hacked\./,
    /\.premium\.free/,
    /\.unlocked/,
  ],

  // Suspicious version patterns
  SUSPICIOUS_VERSION_PATTERNS: [
    /999/,
    /cracked/i,
    /modded/i,
    /hacked/i,
  ],

  // Outdated SDK versions (security risk)
  OUTDATED_MIN_SDK: 21, // Android 5.0 (2014)
  VERY_OUTDATED_MIN_SDK: 16, // Android 4.1 (2012)

  // Suspicious component counts
  EXCESSIVE_RECEIVERS: 20,
  EXCESSIVE_SERVICES: 15,
  EXCESSIVE_ACTIVITIES: 50,
};

// ==================== CLASS ====================

/**
 * DeepScanApkAnalyzer
 * 
 * Analyzes APK files to detect malicious behavior, extract permissions,
 * and assess security risks.
 */
export class DeepScanApkAnalyzer {
  private static instance: DeepScanApkAnalyzer;
  private permissionAnalyzer: typeof DeepScanPermissionAnalyzer;

  private constructor() {
    this.permissionAnalyzer = DeepScanPermissionAnalyzer;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DeepScanApkAnalyzer {
    if (!DeepScanApkAnalyzer.instance) {
      DeepScanApkAnalyzer.instance = new DeepScanApkAnalyzer();
    }
    return DeepScanApkAnalyzer.instance;
  }

  /**
   * Analyze APK file comprehensively
   */
  public async analyzeApk(apkPath: string): Promise<ApkAnalysis> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(apkPath);
      if (!fileInfo.exists) {
        throw new Error(`APK file not found: ${apkPath}`);
      }

      const apkName = apkPath.split('/').pop() || 'unknown.apk';
      const apkSize = fileInfo.size || 0;

      // Extract manifest (this is a simplified version - in production, you'd use aapt2 or similar)
      const manifest = await this.extractManifest(apkPath);
      const metadata = await this.extractMetadata(apkPath);

      // Analyze permissions
      const riskAssessment = await this.permissionAnalyzer.analyzePermissions(manifest.permissions);

      // Check for suspicious characteristics
      const { isSuspicious, suspiciousReasons } = this.checkSuspiciousCharacteristics(
        manifest,
        metadata
      );

      return {
        apkPath,
        apkName,
        apkSize,
        packageName: manifest.packageName,
        versionName: manifest.versionName,
        versionCode: manifest.versionCode,
        minSdkVersion: metadata.minSdkVersion,
        targetSdkVersion: metadata.targetSdkVersion,
        permissions: manifest.permissions,
        activities: manifest.activities,
        services: manifest.services,
        receivers: manifest.receivers,
        providers: manifest.providers,
        riskAssessment,
        isSuspicious,
        suspiciousReasons,
        analysisTimestamp: new Date()
      };
    } catch (error) {
      console.error('Error analyzing APK:', error);
      throw error;
    }
  }

  /**
   * Extract permissions from APK file
   */
  public async extractPermissions(apkPath: string): Promise<string[]> {
    try {
      const manifest = await this.extractManifest(apkPath);
      return manifest.permissions;
    } catch (error) {
      console.error('Error extracting permissions:', error);
      return [];
    }
  }

  /**
   * Extract AndroidManifest.xml from APK
   * 
   * Note: This is a simplified implementation. In production, you would:
   * 1. Use aapt2 (Android Asset Packaging Tool) to extract manifest
   * 2. Parse the binary XML format
   * 3. Or use a native module to handle APK parsing
   */
  public async extractManifest(apkPath: string): Promise<ApkManifest> {
    try {
      // In a real implementation, you would:
      // 1. Unzip the APK file
      // 2. Extract AndroidManifest.xml
      // 3. Parse the binary XML
      // 4. Extract all components and permissions

      // For now, we'll return a placeholder structure
      // In production, integrate with native Android code or aapt2
      
      const apkName = apkPath.split('/').pop() || 'unknown.apk';
      
      // Placeholder - would be replaced with actual manifest parsing
      return {
        packageName: this.guessPackageName(apkName),
        versionName: '1.0.0',
        versionCode: 1,
        permissions: [],
        activities: [],
        services: [],
        receivers: [],
        providers: [],
        usesFeatures: [],
        metadata: {}
      };
    } catch (error) {
      console.error('Error extracting manifest:', error);
      throw error;
    }
  }

  /**
   * Extract APK metadata
   */
  public async extractMetadata(apkPath: string): Promise<ApkMetadata> {
    try {
      // In production, use aapt2 or native module
      const apkName = apkPath.split('/').pop() || 'unknown.apk';
      
      return {
        packageName: this.guessPackageName(apkName),
        versionName: '1.0.0',
        versionCode: 1,
        minSdkVersion: 21,
        targetSdkVersion: 33,
        installLocation: 'auto',
        applicationLabel: apkName.replace('.apk', ''),
        applicationIcon: ''
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw error;
    }
  }

  /**
   * Scan folder for APK files
   */
  public async scanApkFiles(folderPath: string): Promise<ApkFile[]> {
    try {
      const apkFiles: ApkFile[] = [];
      
      const dirInfo = await FileSystem.getInfoAsync(folderPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return apkFiles;
      }

      const files = await FileSystem.readDirectoryAsync(folderPath);
      
      for (const file of files) {
        if (file.toLowerCase().endsWith('.apk')) {
          const filePath = `${folderPath}/${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          apkFiles.push({
            path: filePath,
            name: file,
            size: fileInfo.size || 0,
            directory: folderPath,
            lastModified: new Date(fileInfo.modificationTime || Date.now())
          });
        }
      }

      return apkFiles;
    } catch (error) {
      console.error('Error scanning APK files:', error);
      return [];
    }
  }

  /**
   * Scan all common APK locations
   */
  public async scanAllApkFiles(): Promise<ApkFile[]> {
    const apkLocations = [
      '/storage/emulated/0/Download',
      '/storage/emulated/0/Downloads',
      '/storage/emulated/0/APK',
      '/storage/emulated/0/Download/APK',
      '/storage/emulated/0/Documents',
      '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
      '/storage/emulated/0/Telegram/Telegram Documents',
    ];

    const allApkFiles: ApkFile[] = [];

    for (const location of apkLocations) {
      try {
        const apkFiles = await this.scanApkFiles(location);
        allApkFiles.push(...apkFiles);
      } catch (error) {
        // Continue scanning other locations
        console.log(`Skipping ${location}:`, error);
      }
    }

    return allApkFiles;
  }

  /**
   * Assess APK risk
   */
  public async assessApkRisk(apkPath: string): Promise<ApkRiskAssessment> {
    try {
      const analysis = await this.analyzeApk(apkPath);
      
      // Calculate risk score
      let riskScore = analysis.riskAssessment.riskScore;
      
      // Add bonus for suspicious characteristics
      riskScore += analysis.suspiciousReasons.length * 10;
      
      // Cap at 100
      riskScore = Math.min(100, riskScore);
      
      // Determine risk level
      const riskLevel = this.calculateRiskLevel(riskScore);
      
      // Determine if malicious
      const isMalicious = riskScore >= 70 || analysis.riskAssessment.maliciousPatterns.length > 0;
      
      // Generate recommendations
      const recommendations = this.generateApkRecommendations(analysis, riskScore);

      return {
        riskScore,
        riskLevel,
        isMalicious,
        suspiciousCharacteristics: analysis.suspiciousReasons,
        recommendations,
        permissionRisk: analysis.riskAssessment
      };
    } catch (error) {
      console.error('Error assessing APK risk:', error);
      throw error;
    }
  }

  /**
   * Detect if APK is malicious
   */
  public async detectMaliciousApk(apkPath: string): Promise<boolean> {
    try {
      const riskAssessment = await this.assessApkRisk(apkPath);
      return riskAssessment.isMalicious;
    } catch (error) {
      console.error('Error detecting malicious APK:', error);
      return false;
    }
  }

  /**
   * Calculate APK risk score
   */
  public calculateApkRiskScore(apk: ApkAnalysis): number {
    let score = apk.riskAssessment.riskScore;
    
    // Add points for suspicious characteristics
    score += apk.suspiciousReasons.length * 10;
    
    // Add points for excessive components
    if (apk.receivers.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_RECEIVERS) {
      score += 15;
    }
    if (apk.services.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_SERVICES) {
      score += 15;
    }
    if (apk.activities.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_ACTIVITIES) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Scan and analyze multiple APK files
   */
  public async scanAndAnalyzeApkFiles(folderPath: string): Promise<ApkScanResult> {
    const startTime = Date.now();
    
    const apkFiles = await this.scanApkFiles(folderPath);
    const riskyApkFiles: ApkFile[] = [];
    const maliciousApkFiles: ApkFile[] = [];

    for (const apkFile of apkFiles) {
      try {
        const analysis = await this.analyzeApk(apkFile.path);
        apkFile.analysis = analysis;
        
        const riskScore = this.calculateApkRiskScore(analysis);
        
        if (riskScore >= 70) {
          maliciousApkFiles.push(apkFile);
        } else if (riskScore >= 40) {
          riskyApkFiles.push(apkFile);
        }
      } catch (error) {
        console.error(`Error analyzing ${apkFile.name}:`, error);
      }
    }

    const scanDuration = Date.now() - startTime;

    return {
      totalApkFiles: apkFiles.length,
      apkFiles,
      riskyApkFiles,
      maliciousApkFiles,
      scanDuration,
      scanTimestamp: new Date()
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Check for suspicious APK characteristics
   */
  private checkSuspiciousCharacteristics(
    manifest: ApkManifest,
    metadata: ApkMetadata
  ): { isSuspicious: boolean; suspiciousReasons: string[] } {
    const suspiciousReasons: string[] = [];

    // Check package name
    for (const pattern of APK_SUSPICIOUS_INDICATORS.SUSPICIOUS_PACKAGE_PATTERNS) {
      if (pattern.test(manifest.packageName)) {
        suspiciousReasons.push(`Suspicious package name pattern: ${manifest.packageName}`);
        break;
      }
    }

    // Check version name
    for (const pattern of APK_SUSPICIOUS_INDICATORS.SUSPICIOUS_VERSION_PATTERNS) {
      if (pattern.test(manifest.versionName)) {
        suspiciousReasons.push(`Suspicious version name: ${manifest.versionName}`);
        break;
      }
    }

    // Check SDK versions
    if (metadata.minSdkVersion < APK_SUSPICIOUS_INDICATORS.VERY_OUTDATED_MIN_SDK) {
      suspiciousReasons.push(`Very outdated minimum SDK version: ${metadata.minSdkVersion} (security risk)`);
    } else if (metadata.minSdkVersion < APK_SUSPICIOUS_INDICATORS.OUTDATED_MIN_SDK) {
      suspiciousReasons.push(`Outdated minimum SDK version: ${metadata.minSdkVersion}`);
    }

    // Check for excessive components
    if (manifest.receivers.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_RECEIVERS) {
      suspiciousReasons.push(`Excessive broadcast receivers: ${manifest.receivers.length}`);
    }
    if (manifest.services.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_SERVICES) {
      suspiciousReasons.push(`Excessive services: ${manifest.services.length}`);
    }
    if (manifest.activities.length > APK_SUSPICIOUS_INDICATORS.EXCESSIVE_ACTIVITIES) {
      suspiciousReasons.push(`Excessive activities: ${manifest.activities.length}`);
    }

    return {
      isSuspicious: suspiciousReasons.length > 0,
      suspiciousReasons
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
   * Generate APK-specific recommendations
   */
  private generateApkRecommendations(analysis: ApkAnalysis, riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 80) {
      recommendations.push('⚠️ CRITICAL: Do NOT install this APK - high malware risk');
      recommendations.push('Delete this file immediately');
    } else if (riskScore >= 60) {
      recommendations.push('⚠️ HIGH RISK: Avoid installing this APK');
      recommendations.push('Only install if from a verified trusted source');
    } else if (riskScore >= 40) {
      recommendations.push('⚠️ MEDIUM RISK: Exercise caution');
      recommendations.push('Verify the source before installation');
    } else if (riskScore >= 20) {
      recommendations.push('ℹ️ LOW RISK: Generally safe but review permissions');
    } else {
      recommendations.push('✅ Appears safe to install');
    }

    // Add specific recommendations based on analysis
    if (analysis.suspiciousReasons.length > 0) {
      recommendations.push('Suspicious characteristics detected:');
      analysis.suspiciousReasons.forEach(reason => {
        recommendations.push(`  • ${reason}`);
      });
    }

    if (analysis.riskAssessment.maliciousPatterns.length > 0) {
      recommendations.push('Malicious permission patterns detected:');
      analysis.riskAssessment.maliciousPatterns.forEach(pattern => {
        recommendations.push(`  • ${pattern.patternName}: ${pattern.description}`);
      });
    }

    return recommendations;
  }

  /**
   * Guess package name from APK filename
   */
  private guessPackageName(apkName: string): string {
    // Remove .apk extension
    let name = apkName.replace('.apk', '');
    
    // Remove version numbers and common suffixes
    name = name.replace(/[-_]v?\d+(\.\d+)*/, '');
    name = name.replace(/[-_](release|debug|beta|alpha|final)$/i, '');
    
    // Convert to package name format
    name = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    
    return `com.unknown.${name}`;
  }
}

// Export singleton instance
export default DeepScanApkAnalyzer.getInstance();
