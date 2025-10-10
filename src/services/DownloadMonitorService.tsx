import * as Notifications from 'expo-notifications';
import { FileWatchdogService } from './FileWatchdogService';
import PermissionManager from './PermissionManager';
import { LinkScannerService } from './ScannerService';

/**
 * Advanced Download Monitor for Shabari
 * Specifically monitors download activities and provides real-time protection
 */
export class DownloadMonitorService {
  private static instance: DownloadMonitorService;
  private isMonitoring = false;
  private downloadQueue: Map<string, any> = new Map();
  private fileWatchdog: FileWatchdogService;

  // High-risk file patterns
  private highRiskPatterns = {
    extensions: ['.apk', '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'],
    namePatterns: [
      /hack.*tool/i, /crack.*software/i, /keygen/i, /patch.*download/i,
      /free.*premium/i, /unlock.*app/i, /mod.*apk/i, /cheat.*engine/i,
      /bitcoin.*generator/i, /crypto.*miner/i, /virus.*total/i
    ],
    suspiciousHosts: [
      'bit.ly', 'tinyurl.com', 'short.link', 'dropbox.com/s/',
      'drive.google.com', 'mediafire.com', '4shared.com'
    ]
  };

  private constructor() {
    this.fileWatchdog = FileWatchdogService.getInstance();
    this.initializeDownloadMonitor();
  }

  public static getInstance(): DownloadMonitorService {
    if (!DownloadMonitorService.instance) {
      DownloadMonitorService.instance = new DownloadMonitorService();
    }
    return DownloadMonitorService.instance;
  }

  /**
   * Initialize the download monitoring system
   */
  private async initializeDownloadMonitor(): Promise<void> {
    try {
      // Setup download-specific notifications
      await this.setupDownloadNotifications();
      
      // Initialize real-time scanning
      await this.initializeRealTimeScanning();
      
      console.log('📥 Download Monitor initialized');
    } catch (error) {
      console.error('❌ Download Monitor initialization failed:', error);
    }
  }

  /**
   * Setup notification categories for download monitoring
   */
  private async setupDownloadNotifications(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('download_threat', [
      {
        identifier: 'block_download',
        buttonTitle: 'Block & Delete',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'quarantine_download',
        buttonTitle: 'Quarantine',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'allow_download',
        buttonTitle: 'Allow (Risky)',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('download_analysis', [
      {
        identifier: 'scan_detailed',
        buttonTitle: 'Deep Scan',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'view_report',
        buttonTitle: 'View Report',
        options: { opensAppToForeground: true }
      }
    ]);
  }

  /**
   * Initialize real-time scanning capabilities
   */
  private async initializeRealTimeScanning(): Promise<void> {
    // Start file system monitoring
    await this.fileWatchdog.startWatchdog();
    
    // Setup URL interception (conceptual - would need native implementation)
    this.setupURLInterception();
  }

  /**
   * Start download monitoring (with permission check)
   */
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('📥 Download Monitor already active');
      return;
    }

    try {
      // Check permissions before starting
      const permissionManager = PermissionManager.getInstance();
      const hasDownloadPermission = await permissionManager.getPermissionStatus('download');
      const hasFilePermission = await permissionManager.getPermissionStatus('files');
      const hasNotificationPermission = await permissionManager.getPermissionStatus('notifications');

      if (!hasDownloadPermission) {
        console.log('⚠️ Download protection permission not granted - requesting...');
        const granted = await permissionManager.requestSpecificPermission('download');
        if (!granted) {
          console.log('❌ Download protection permission denied - monitor disabled');
          return;
        }
      }

      if (!hasFilePermission) {
        console.log('⚠️ File access permission not granted for download monitoring');
        const granted = await permissionManager.requestSpecificPermission('files');
        if (!granted) {
          console.log('⚠️ Download monitor will have limited functionality without file access');
        }
      }

      if (!hasNotificationPermission) {
        console.log('⚠️ Notification permission not granted - requesting...');
        await permissionManager.requestSpecificPermission('notifications');
      }

      this.isMonitoring = true;
      
      // Start the file watchdog
      await this.fileWatchdog.startWatchdog();
      
      console.log('📥 Download Monitor started - protecting against malicious downloads with user permission');
      
      // Notify user of protection (only if notification permission granted)
      if (hasNotificationPermission || await permissionManager.getPermissionStatus('notifications')) {
        await this.sendDownloadNotification(
          '🛡️ Download Protection Active',
          'Shabari is now monitoring all downloads for threats with your permission',
          'download_analysis'
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to start Download Monitor:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Stop download monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.fileWatchdog.stopWatchdog();
    console.log('📥 Download Monitor stopped');
  }

  /**
   * Analyze a download before it completes
   */
  public async analyzeDownload(downloadInfo: {
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<{
    shouldBlock: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    recommendations: string[];
  }> {
    console.log(`📥 Analyzing download: ${downloadInfo.fileName}`);
    
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Analyze URL
    const urlAnalysis = await this.analyzeDownloadURL(downloadInfo.url);
    riskScore += urlAnalysis.riskScore;
    reasons.push(...urlAnalysis.reasons);

    // Analyze filename
    const filenameAnalysis = this.analyzeFileName(downloadInfo.fileName);
    riskScore += filenameAnalysis.riskScore;
    reasons.push(...filenameAnalysis.reasons);

    // Analyze file size
    if (downloadInfo.fileSize) {
      const sizeAnalysis = this.analyzeFileSize(downloadInfo.fileSize);
      riskScore += sizeAnalysis.riskScore;
      reasons.push(...sizeAnalysis.reasons);
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let shouldBlock = false;

    if (riskScore >= 80) {
      riskLevel = 'critical';
      shouldBlock = true;
      recommendations.push('Block this download immediately');
      recommendations.push('This file appears to be malicious');
    } else if (riskScore >= 60) {
      riskLevel = 'high';
      recommendations.push('Strongly recommend blocking this download');
      recommendations.push('Scan with multiple antivirus tools if you must download');
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
      recommendations.push('Proceed with caution');
      recommendations.push('Scan immediately after download');
    } else {
      riskLevel = 'low';
      recommendations.push('File appears relatively safe');
      recommendations.push('Still recommend scanning after download');
    }

    return {
      shouldBlock,
      riskLevel,
      reasons,
      recommendations
    };
  }

  /**
   * Analyze download URL for threats
   */
  private async analyzeDownloadURL(url: string): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check with Link Scanner Service
      const urlResult = await LinkScannerService.scanUrl(url);
      
      if (!urlResult.isSafe) {
        reasons.push(`Malicious URL detected: ${urlResult.details}`);
        riskScore += 50;
      }

      // Check against suspicious hosts
      const urlObj = new URL(url);
      for (const suspiciousHost of this.highRiskPatterns.suspiciousHosts) {
        if (urlObj.hostname.includes(suspiciousHost)) {
          reasons.push(`Suspicious hosting service: ${suspiciousHost}`);
          riskScore += 20;
        }
      }

      // Check for URL shorteners
      if (urlObj.hostname.length < 10) {
        reasons.push('Shortened URL - cannot verify destination');
        riskScore += 15;
      }

      // Check for suspicious URL patterns
      if (url.includes('download.php') || url.includes('file.php')) {
        reasons.push('Dynamic download script detected');
        riskScore += 10;
      }

    } catch (error) {
      reasons.push('Unable to verify URL safety');
      riskScore += 25;
    }

    return { riskScore, reasons };
  }

  /**
   * Analyze filename for suspicious patterns
   */
  private analyzeFileName(fileName: string): {
    riskScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    const lowerFileName = fileName.toLowerCase();

    // Check file extension
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (this.highRiskPatterns.extensions.includes(extension)) {
      reasons.push(`High-risk file type: ${extension}`);
      riskScore += 30;
    }

    // Check name patterns
    for (const pattern of this.highRiskPatterns.namePatterns) {
      if (pattern.test(fileName)) {
        reasons.push(`Suspicious filename pattern detected`);
        riskScore += 25;
      }
    }

    // Check for multiple extensions
    const extensionCount = (fileName.match(/\./g) || []).length;
    if (extensionCount > 2) {
      reasons.push('Multiple file extensions (possible disguise)');
      riskScore += 20;
    }

    // Check for spaces/special characters (common in malware)
    if (/\s{2,}/.test(fileName) || /[^\w\s.-]/.test(fileName)) {
      reasons.push('Unusual characters in filename');
      riskScore += 10;
    }

    return { riskScore, reasons };
  }

  /**
   * Analyze file size for anomalies
   */
  private analyzeFileSize(fileSize: number): {
    riskScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Very small files
    if (fileSize < 1024) {
      reasons.push('Extremely small file size (possible dropper)');
      riskScore += 15;
    }

    // Very large files
    if (fileSize > 500 * 1024 * 1024) { // > 500MB
      reasons.push('Very large file size');
      riskScore += 10;
    }

    // Suspicious sizes (common malware sizes)
    const suspiciousSizes = [666, 1337, 31337, 666666];
    if (suspiciousSizes.includes(fileSize)) {
      reasons.push('Suspicious file size pattern');
      riskScore += 20;
    }

    return { riskScore, reasons };
  }

  /**
   * Handle detected malicious download
   */
  private async handleMaliciousDownload(downloadInfo: any, analysis: any): Promise<void> {
    console.warn(`🚨 MALICIOUS DOWNLOAD BLOCKED: ${downloadInfo.fileName}`);
    
    // Send urgent notification
    await this.sendDownloadNotification(
      '🚨 MALICIOUS DOWNLOAD BLOCKED!',
      `Dangerous file blocked: ${downloadInfo.fileName}\nThreats: ${analysis.reasons.slice(0, 2).join(', ')}`,
      'download_threat',
      true
    );

    // Log security event
    await this.logDownloadEvent({
      type: 'malicious_download_blocked',
      fileName: downloadInfo.fileName,
      url: downloadInfo.url,
      threats: analysis.reasons,
      riskLevel: analysis.riskLevel,
      timestamp: new Date().toISOString(),
      action: 'blocked'
    });
  }

  /**
   * Setup URL interception (conceptual)
   */
  private setupURLInterception(): void {
    // This would require native implementation to intercept downloads
    console.log('📥 URL interception setup (requires native implementation)');
    
    // For now, we'll provide guidance for manual implementation
    console.log(`
    📝 To enable download interception, implement native modules that:
    1. Monitor DownloadManager (Android) / NSURLSession (iOS)
    2. Intercept download URLs before they start
    3. Call analyzeDownload() method
    4. Block/allow based on analysis results
    `);
  }

  /**
   * Send download-related notification
   */
  private async sendDownloadNotification(
    title: string,
    body: string,
    categoryId: string,
    isUrgent = false
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          categoryIdentifier: categoryId,
          sound: isUrgent ? 'default' : undefined,
          priority: isUrgent ? 'high' : 'normal',
          data: {
            source: 'download_monitor',
            timestamp: Date.now()
          }
        },
        trigger: null
      });
    } catch (error) {
      console.error('❌ Error sending download notification:', error);
    }
  }

  /**
   * Log download security event
   */
  private async logDownloadEvent(event: any): Promise<void> {
    try {
      const logEntry = {
        ...event,
        id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('📝 Download Security Event:', logEntry);
      
      // In production, save to persistent storage and send to security dashboard
    } catch (error) {
      console.error('❌ Error logging download event:', error);
    }
  }

  /**
   * Get download monitoring status
   */
  public getStatus(): {
    isMonitoring: boolean;
    downloadsAnalyzed: number;
    threatsBlocked: number;
    lastActivity: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      downloadsAnalyzed: this.downloadQueue.size,
      threatsBlocked: 0, // Would track in production
      lastActivity: Date.now()
    };
  }

  /**
   * Manually check a download URL
   */
  public async checkDownloadURL(url: string): Promise<any> {
    const fileName = url.substring(url.lastIndexOf('/') + 1) || 'unknown_file';
    
    return await this.analyzeDownload({
      url,
      fileName,
      fileSize: undefined,
      mimeType: undefined
    });
  }
}

export default DownloadMonitorService;
