import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { YaraSecurityService } from './YaraSecurityService';

export interface FileScanResult {
  isSafe: boolean;
  threatName?: string;
  scanEngine: string;
  scanTime: Date;
  details: string;
  filePath: string;
  fileSize?: number;
}

export interface ScanProgress {
  currentFile: string;
  filesScanned: number;
  totalFiles: number;
  threats: number;
}

export class NativeFileScanner {
  private static instance: NativeFileScanner;
  private isInitialized: boolean = false;
  private scanInProgress: boolean = false;

  private constructor() {}

  static getInstance(): NativeFileScanner {
    if (!NativeFileScanner.instance) {
      NativeFileScanner.instance = new NativeFileScanner();
    }
    return NativeFileScanner.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🔍 Initializing Native File Scanner...');
      
      // Initialize YARA engine
      const yaraInitialized = await YaraSecurityService.initialize();
      if (!yaraInitialized) {
        console.warn('⚠️ YARA engine initialization failed, using fallback scanning');
      }

      this.isInitialized = true;
      console.log('✅ Native File Scanner initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Native File Scanner initialization failed:', error);
      return false;
    }
  }

  async scanFile(filePath: string): Promise<FileScanResult> {
    try {
      await this.initialize();

      console.log('🔍 Scanning file:', filePath);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Use YARA for primary scanning
      const yaraResult = await YaraSecurityService.scanFile(filePath);
      
      // Additional security checks
      const additionalChecks = await this.performAdditionalSecurityChecks(filePath, fileInfo);
      
      // Combine results
      const finalResult: FileScanResult = {
        isSafe: yaraResult.isSafe && additionalChecks.isSafe,
        threatName: yaraResult.threatName || additionalChecks.threatName,
        scanEngine: `YARA + Security Checks`,
        scanTime: new Date(),
        details: this.combineDetails(yaraResult.details, additionalChecks.details),
        filePath: filePath,
        fileSize: fileInfo.size
      };

      console.log(`🛡️ File scan completed: ${finalResult.isSafe ? 'SAFE' : 'THREAT DETECTED'}`);
      return finalResult;

    } catch (error) {
      console.error('❌ File scan error:', error);
      return {
        isSafe: false,
        threatName: 'Scan Error',
        scanEngine: 'Error Handler',
        scanTime: new Date(),
        details: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath: filePath
      };
    }
  }

  async scanDirectory(directoryPath: string, 
                     onProgress?: (progress: ScanProgress) => void): Promise<FileScanResult[]> {
    // COMPLIANCE: Directory scanning disabled for Play Store compliance
    console.log('🔒 NativeFileScanner: Directory scanning disabled for Play Store compliance');
    console.log('🔒 Scoped storage policies prevent recursive directory access');
    console.log('🔒 Use individual file scanning instead (user-initiated only)');
    
          if (onProgress) {
            onProgress({
        currentFile: 'Compliance mode - directory scanning disabled',
        filesScanned: 0,
        totalFiles: 0,
        threats: 0
      });
    }
    
    return [];
  }

  private async getAllFilesRecursively(directoryPath: string): Promise<string[]> {
    // COMPLIANCE: Recursive directory scanning disabled for Play Store compliance
    console.log('🔒 NativeFileScanner: Recursive directory scanning disabled for Play Store compliance');
    console.log('🔒 Scoped storage policies prevent deep directory traversal');
    
    return [];
  }

  private async performAdditionalSecurityChecks(filePath: string, fileInfo: any): Promise<{
    isSafe: boolean;
    threatName?: string;
    details: string;
  }> {
    const checks = [];
    const fileName = filePath.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    // File size checks
    if (fileInfo.size > 100 * 1024 * 1024) { // 100MB
      checks.push('Large file size (>100MB)');
    }

    // Suspicious file extensions
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'scr', 'com', 'pif', 'vbs', 'js'];
    if (suspiciousExtensions.includes(fileExtension)) {
      checks.push(`Potentially dangerous file type: .${fileExtension}`);
    }

    // Suspicious file names
    const suspiciousNames = ['trojan', 'virus', 'malware', 'keylog', 'backdoor'];
    if (suspiciousNames.some(name => fileName.toLowerCase().includes(name))) {
      checks.push('Suspicious filename detected');
    }

    // Double extension check
    const parts = fileName.split('.');
    if (parts.length > 2) {
      checks.push('Multiple file extensions detected');
    }

    const isSafe = checks.length === 0;
    const threatName = checks.length > 0 ? 'Suspicious File Properties' : undefined;
    const details = checks.length > 0 ? 
      `Security warnings: ${checks.join(', ')}` : 
      'File passed additional security checks';

    return { isSafe, threatName, details };
  }

  private combineDetails(yaraDetails: string, additionalDetails: string): string {
    return `YARA: ${yaraDetails}\nSecurity Checks: ${additionalDetails}`;
  }

  async getQuickScanDirectories(): Promise<string[]> {
    const directories: string[] = [];
    
    try {
      // Common directories to scan
      if (Platform.OS === 'android') {
        directories.push(
          FileSystem.documentDirectory || '',
          FileSystem.cacheDirectory || ''
        );
      }
    } catch (error) {
      console.error('Error getting scan directories:', error);
    }
    
    return directories.filter(dir => dir.length > 0);
  }

  isScanInProgress(): boolean {
    return this.scanInProgress;
  }

  async getEngineStatus(): Promise<{
    fileScanner: boolean;
    yaraEngine: boolean;
    initialized: boolean;
  }> {
    const yaraStatus = await YaraSecurityService.getEngineStatus();
    
    return {
      fileScanner: this.isInitialized,
      yaraEngine: yaraStatus.available && yaraStatus.initialized,
      initialized: this.isInitialized
    };
  }
} 