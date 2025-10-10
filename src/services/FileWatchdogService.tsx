import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PermissionManager from './PermissionManager';
import { YaraSecurityService } from './YaraSecurityService';

interface WatchdogFile {
  uri: string;
  name: string;
  size?: number;
  exists: boolean;
  isDirectory: boolean;
  modificationTime?: number;
  md5?: string;
}

/**
 * Real-time File Watchdog Service for Shabari
 * Automatically monitors downloads and file changes for threats
 */
export class FileWatchdogService {
  private static instance: FileWatchdogService;
  private isActive = false;
  private watchInterval: NodeJS.Timeout | null = null;
  private lastScanTime = 0;
  private watchedDirectories: string[] = [];
  private knownFiles = new Set<string>();

  // Threat patterns to detect
  private suspiciousExtensions = [
    '.apk', '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar',
    '.zip', '.rar', '.7z', '.dmg', '.pkg', '.deb', '.rpm'
  ];

  private maliciousKeywords = [
    'hack', 'crack', 'keygen', 'patch', 'trojan', 'virus', 'malware',
    'spyware', 'adware', 'ransomware', 'bitcoin', 'crypto', 'miner'
  ];

  private constructor() {
    this.initializeWatchdog();
  }

  public static getInstance(): FileWatchdogService {
    if (!FileWatchdogService.instance) {
      FileWatchdogService.instance = new FileWatchdogService();
    }
    return FileWatchdogService.instance;
  }

  /**
   * Initialize the file watchdog system
   */
  private async initializeWatchdog(): Promise<void> {
    try {
      // Setup notification categories
      await this.setupNotificationCategories();
      
      // Get standard download directories
      await this.setupWatchedDirectories();
      
      console.log('🐕 File Watchdog initialized successfully');
    } catch (error) {
      console.error('❌ File Watchdog initialization failed:', error);
    }
  }

  /**
   * Setup notification categories for different threat types
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('threat_detected', [
      {
        identifier: 'quarantine',
        buttonTitle: 'Quarantine File',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'scan_deeper',
        buttonTitle: 'Deep Scan',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'ignore',
        buttonTitle: 'Ignore',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('download_alert', [
      {
        identifier: 'scan_now',
        buttonTitle: 'Scan Now',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'view_details',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true }
      }
    ]);
  }

  /**
   * Setup directories to watch for file changes
   */
  private async setupWatchedDirectories(): Promise<void> {
    const directories = [];

    // Add common download directories
    if (Platform.OS === 'android') {
      // Android download directories
      directories.push(
        `${FileSystem.documentDirectory}Download/`,
        `${FileSystem.documentDirectory}Downloads/`,
        `${FileSystem.cacheDirectory}`,
        `${FileSystem.documentDirectory}`
      );
    }

    // Filter existing directories
    for (const dir of directories) {
      try {
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists && info.isDirectory) {
          this.watchedDirectories.push(dir);
        }
      } catch (error) {
        console.warn(`⚠️ Cannot access directory: ${dir}`);
      }
    }

    console.log(`🐕 Watching ${this.watchedDirectories.length} directories:`, this.watchedDirectories);
  }

  /**
   * Start the file watchdog monitoring (with permission check)
   */
  public async startWatchdog(): Promise<void> {
    if (this.isActive) {
      console.log('🐕 File Watchdog already active');
      return;
    }

    try {
      // Check permissions before starting
      const permissionManager = PermissionManager.getInstance();
      const hasBackgroundPermission = await permissionManager.getPermissionStatus('background');
      const hasFilePermission = await permissionManager.getPermissionStatus('files');
      const hasNotificationPermission = await permissionManager.getPermissionStatus('notifications');

      if (!hasBackgroundPermission) {
        console.log('⚠️ Background monitoring permission not granted - requesting...');
        const granted = await permissionManager.requestSpecificPermission('background');
        if (!granted) {
          console.log('❌ Background monitoring permission denied - watchdog disabled');
          return;
        }
      }

      if (!hasFilePermission) {
        console.log('⚠️ File access permission not granted - requesting...');
        const granted = await permissionManager.requestSpecificPermission('files');
        if (!granted) {
          console.log('⚠️ File access limited - watchdog will have reduced functionality');
        }
      }

      if (!hasNotificationPermission) {
        console.log('⚠️ Notification permission not granted - requesting...');
        await permissionManager.requestSpecificPermission('notifications');
      }

      this.isActive = true;
      this.lastScanTime = Date.now();
      
      // Perform initial scan
      await this.performInitialScan();
      
      // Start periodic monitoring
      this.watchInterval = setInterval(async () => {
        await this.monitorFileChanges();
      }, 30000); // Check every 30 seconds

      console.log('🐕 File Watchdog started - monitoring for threats with user permission');
      
      // Notify user (only if notification permission granted)
      if (hasNotificationPermission || await permissionManager.getPermissionStatus('notifications')) {
        await this.sendNotification(
          '🛡️ File Watchdog Active',
          'Shabari is now monitoring your device for malicious files with your permission',
          'download_alert'
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to start File Watchdog:', error);
      this.isActive = false;
    }
  }

  /**
   * Stop the file watchdog monitoring
   */
  public stopWatchdog(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }

    console.log('🐕 File Watchdog stopped');
  }

  /**
   * Perform initial scan of watched directories
   */
  private async performInitialScan(): Promise<void> {
    console.log('🐕 Performing initial file scan...');
    
    for (const directory of this.watchedDirectories) {
      try {
        const files = await this.getDirectoryFiles(directory);
        for (const file of files) {
          this.knownFiles.add(file.uri);
        }
      } catch (error) {
        console.warn(`⚠️ Error scanning directory ${directory}:`, error);
      }
    }

    console.log(`🐕 Initial scan complete - tracking ${this.knownFiles.size} files`);
  }

  /**
   * Monitor for file changes in watched directories
   */
  private async monitorFileChanges(): Promise<void> {
    if (!this.isActive) return;

    for (const directory of this.watchedDirectories) {
      try {
        const currentFiles = await this.getDirectoryFiles(directory);
        
        // Check for new files
        for (const file of currentFiles) {
          if (!this.knownFiles.has(file.uri)) {
            this.knownFiles.add(file.uri);
            await this.analyzeNewFile(file);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error monitoring directory ${directory}:`, error);
      }
    }
  }

  /**
   * Get all files in a directory
   */
  private async getDirectoryFiles(directory: string): Promise<WatchdogFile[]> {
    try {
      const items = await FileSystem.readDirectoryAsync(directory);
      const files: WatchdogFile[] = [];
      
      for (const item of items) {
        const itemPath = `${directory}${item}`;
        const info = await FileSystem.getInfoAsync(itemPath);
        
        if (info.exists && !info.isDirectory) {
          const file: WatchdogFile = {
            uri: itemPath,
            name: item,
            size: 'size' in info ? info.size : undefined,
            exists: info.exists,
            isDirectory: info.isDirectory,
            modificationTime: 'modificationTime' in info ? info.modificationTime : undefined,
            md5: 'md5' in info ? info.md5 : undefined
          };
          files.push(file);
        }
      }
      
      return files;
    } catch (error) {
      console.warn(`⚠️ Error reading directory ${directory}:`, error);
      return [];
    }
  }

  /**
   * Analyze a newly detected file for threats
   */
  private async analyzeNewFile(file: any): Promise<void> {
    console.log(`🐕 Analyzing new file: ${file.name}`);
    
    try {
      const threatLevel = await this.assessFileThreat(file);
      
      if (threatLevel.isHighRisk) {
        await this.handleHighRiskFile(file, threatLevel);
      } else if (threatLevel.isSuspicious) {
        await this.handleSuspiciousFile(file, threatLevel);
      } else {
        console.log(`✅ File appears safe: ${file.name}`);
      }
    } catch (error) {
      console.error(`❌ Error analyzing file ${file.name}:`, error);
    }
  }

  /**
   * Assess threat level of a file
   */
  private async assessFileThreat(file: any): Promise<{
    isHighRisk: boolean;
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (this.suspiciousExtensions.includes(extension)) {
      reasons.push(`Suspicious file type: ${extension}`);
      riskScore += 30;
    }

    // Check filename for malicious keywords
    const lowerName = file.name.toLowerCase();
    for (const keyword of this.maliciousKeywords) {
      if (lowerName.includes(keyword)) {
        reasons.push(`Suspicious filename keyword: ${keyword}`);
        riskScore += 25;
      }
    }

    // Check file size (very small or very large files can be suspicious)
    if (file.size && file.size < 1024) {
      reasons.push('Unusually small file size');
      riskScore += 10;
    } else if (file.size && file.size > 100 * 1024 * 1024) { // > 100MB
      reasons.push('Large file size');
      riskScore += 15;
    }

    // Try YARA scanning if available
    try {
      const yaraResult = await YaraSecurityService.scanFile(file.uri);
      
      if (!yaraResult.isSafe) {
        reasons.push(`YARA detection: ${yaraResult.threatName}`);
        riskScore += 50;
      }
    } catch (error) {
      console.warn('⚠️ YARA scan not available for watchdog');
    }

    // Check if file contains URLs (for document types)
    if (['.txt', '.pdf', '.doc', '.docx'].includes(extension)) {
      // This would require file content analysis
      // For now, we'll skip this check
    }

    return {
      isHighRisk: riskScore >= 60,
      isSuspicious: riskScore >= 30 && riskScore < 60,
      reasons,
      riskScore
    };
  }

  /**
   * Handle high-risk files
   */
  private async handleHighRiskFile(file: any, threat: any): Promise<void> {
    console.warn(`🚨 HIGH RISK FILE DETECTED: ${file.name}`);
    
    // Send urgent notification
    await this.sendNotification(
      '🚨 THREAT DETECTED!',
      `High-risk file found: ${file.name}\nRisk: ${threat.reasons.join(', ')}`,
      'threat_detected',
      true // high priority
    );

    // Log to security history
    await this.logSecurityEvent({
      type: 'high_risk_file',
      fileName: file.name,
      filePath: file.uri,
      threats: threat.reasons,
      riskScore: threat.riskScore,
      timestamp: new Date().toISOString(),
      action: 'detected'
    });
  }

  /**
   * Handle suspicious files
   */
  private async handleSuspiciousFile(file: any, threat: any): Promise<void> {
    console.log(`⚠️ Suspicious file detected: ${file.name}`);
    
    // Send notification
    await this.sendNotification(
      '⚠️ Suspicious File',
      `Potentially risky file: ${file.name}\nRecommend scanning`,
      'download_alert'
    );

    // Log to security history
    await this.logSecurityEvent({
      type: 'suspicious_file',
      fileName: file.name,
      filePath: file.uri,
      threats: threat.reasons,
      riskScore: threat.riskScore,
      timestamp: new Date().toISOString(),
      action: 'detected'
    });
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    title: string,
    body: string,
    categoryId: string,
    isHighPriority = false
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          categoryIdentifier: categoryId,
          sound: isHighPriority ? 'default' : undefined,
          priority: isHighPriority ? 'high' : 'normal',
          data: {
            source: 'file_watchdog',
            timestamp: Date.now()
          }
        },
        trigger: null // Send immediately
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: any): Promise<void> {
    try {
      // Store in app's security log
      const logEntry = {
        ...event,
        id: `watchdog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // In a real implementation, this would be saved to persistent storage
      console.log('📝 Security Event Logged:', logEntry);
      
      // Could also send to analytics or security dashboard
    } catch (error) {
      console.error('❌ Error logging security event:', error);
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  /**
   * Get watchdog status
   */
  public getStatus(): {
    isActive: boolean;
    watchedDirectories: number;
    knownFiles: number;
    lastScan: number;
  } {
    return {
      isActive: this.isActive,
      watchedDirectories: this.watchedDirectories.length,
      knownFiles: this.knownFiles.size,
      lastScan: this.lastScanTime
    };
  }

  /**
   * Manually trigger a scan
   */
  public async manualScan(): Promise<void> {
    console.log('🐕 Manual scan triggered');
    await this.monitorFileChanges();
  }

  /**
   * Quarantine a file (move to secure location)
   */
  public async quarantineFile(filePath: string): Promise<boolean> {
    try {
      const quarantineDir = `${FileSystem.documentDirectory}quarantine/`;
      
      // Create quarantine directory if it doesn't exist
      const quarantineDirInfo = await FileSystem.getInfoAsync(quarantineDir);
      if (!quarantineDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(quarantineDir, { intermediates: true });
      }

      // Move file to quarantine
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      const quarantinePath = `${quarantineDir}${Date.now()}_${fileName}`;
      
      await FileSystem.moveAsync({
        from: filePath,
        to: quarantinePath
      });

      console.log(`🛡️ File quarantined: ${fileName}`);
      
      await this.logSecurityEvent({
        type: 'file_quarantined',
        fileName,
        originalPath: filePath,
        quarantinePath,
        timestamp: new Date().toISOString(),
        action: 'quarantined'
      });

      return true;
    } catch (error) {
      console.error('❌ Error quarantining file:', error);
      return false;
    }
  }
}

export default FileWatchdogService;
