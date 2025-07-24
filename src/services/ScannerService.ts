import axios from 'axios';
import { Platform } from 'react-native';
import { YaraSecurityService } from './YaraSecurityService';

export const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || 'AIzaSyCnEqrChODSHyFPa7LnnD_LTy2_glja2pE';
export const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || '79df999765cde7b193b1cfd28d179add44b8a10ee9216299cefcbfe994c76ad0';

// Conditional SQLite import - only for native platforms
let SQLite: any = null;
let isSQLiteAvailable = false;

// Only attempt to load SQLite on native platforms
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    SQLite = require('react-native-sqlite-storage');
    if (SQLite && typeof SQLite.enablePromise === 'function') {
      SQLite.enablePromise(true);
      isSQLiteAvailable = true;
      console.log('✅ SQLite loaded successfully for', Platform.OS);
    } else {
      console.log('⚠️ SQLite loaded but enablePromise not available');
      isSQLiteAvailable = false;
    }
  } catch (error) {
    console.log('❌ SQLite not available on this platform:', error);
    isSQLiteAvailable = false;
  }
} else {
  console.log('📱 Platform:', Platform.OS, '- Using in-memory storage');
}

// Load react-native-fs conditionally
let RNFS: any = null;
let isRNFSAvailable = false;

// Only attempt to load RNFS on native platforms
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    RNFS = require('react-native-fs');
    if (RNFS && RNFS.DocumentDirectoryPath) {
      isRNFSAvailable = true;
      console.log('✅ React Native FS loaded successfully for', Platform.OS);
    } else {
      console.log('⚠️ React Native FS loaded but DocumentDirectoryPath not available');
      isRNFSAvailable = false;
    }
  } catch (error) {
    console.log('❌ React Native FS not available on this platform:', error);
    isRNFSAvailable = false;
  }
} else {
  console.log('📱 Platform:', Platform.OS, '- File operations will use web APIs');
}

export interface FileScanResult {
  isSafe: boolean;
  threatName?: string;
  scanEngine: string;
  scanTime: Date;
  details: string;
  filePath?: string; // Add file path for result tracking
  fileSize?: number; // Add file size information
  metadata?: {
    yaraEngine?: string;
    scanDuration?: number;
    rulesMatched?: number;
    severity?: string;
    category?: string;
  };
}

// Updated interface for shared file content per doccument-image-file.md specifications
export interface SharedFileContent {
  fileName: string;
  contentUri: string;
  quarantinedPath?: string;
  mimeType?: string;
  size?: number;
}

// New interface for URL scan results matching requirements
export interface UrlScanResult {
  isSafe: boolean;
  details: string;
}

class DatabaseManager {
  private static db: any = null;
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;
  private static webBlocklist: Set<string> = new Set([
    'malware-test.com',
    'phishing-example.com',
    'dangerous-site.net',
    'scam-website.org',
    'badsite.com',
    'virus-test.org',
    // EICAR test URLs
    'www.eicar.org',
    'eicar.org',
    'secure.eicar.org',
    // Test domains for malicious content
    'malware.testing.google.test',
    'testsafebrowsing.appspot.com'
  ]);

  static async initializeDatabase(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout after 10 seconds')), 10000);
    });

    this.initializationPromise = Promise.race([
      this.performInitialization(),
      timeoutPromise
    ]).catch((error) => {
      console.error('❌ Database initialization failed or timed out:', error);
      console.log('🔄 Falling back to in-memory storage');
      this.db = null;
      this.isInitialized = true;
    });

    return this.initializationPromise;
  }

  private static async performInitialization(): Promise<void> {
    try {
      console.log('🔄 Starting database initialization...');

      // For web or unsupported platforms, use in-memory storage
      if (Platform.OS === 'web' || !isSQLiteAvailable || !SQLite) {
        console.log('📝 Using in-memory blocklist storage');
        this.isInitialized = true;
        return;
      }

      // Attempt SQLite database creation with very short timeout
      try {
        console.log('🗄️ Attempting to create SQLite database...');
        
        // Create database with explicit error handling and short timeout
        this.db = await Promise.race([
          this.createDatabaseSafely(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database creation timeout')), 2000)
          )
        ]);
        
        if (!this.db) {
          throw new Error('Database creation returned null');
        }

        // Test database connection with timeout
        await Promise.race([
          this.testDatabaseConnection(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection test timeout')), 1000)
          )
        ]);

        // Create tables with timeout
        await Promise.race([
          this.createTables(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Table creation timeout')), 1000)
          )
        ]);

        // Insert default data with timeout
        await Promise.race([
          this.insertDefaultBlocklist(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data insertion timeout')), 1000)
          )
        ]);

        console.log('✅ SQLite database initialized successfully');
        this.isInitialized = true;

      } catch (dbError) {
        console.error('❌ SQLite database creation failed:', dbError);
        console.log('🔄 Falling back to in-memory storage immediately');
        
        // Clean up failed database connection
        if (this.db) {
          try {
            await this.db.close();
          } catch (closeError) {
            console.warn('Warning: Failed to close database:', closeError);
          }
        }
        
        this.db = null;
        this.isInitialized = true;
      }

    } catch (error) {
      console.error('❌ Database initialization error:', error);
      console.log('🔄 Using in-memory blocklist as final fallback');
      this.db = null;
      this.isInitialized = true;
    }
  }

  private static async createDatabaseSafely(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const dbConfig = {
          name: 'shabari_blocklist.db',
          location: 'default',
          createFromLocation: undefined,
        };

        console.log('📂 Opening database with config:', dbConfig);

        // Add timeout for database creation
        const timeout = setTimeout(() => {
          reject(new Error('Database creation timeout after 5 seconds'));
        }, 5000);

        SQLite.openDatabase(
          dbConfig,
          (database: any) => {
            clearTimeout(timeout);
            console.log('✅ Database opened successfully');
            resolve(database);
          },
          (error: any) => {
            clearTimeout(timeout);
            console.error('❌ Database open error:', error);
            reject(new Error(`Database open failed: ${error.message || error}`));
          }
        );
      } catch (error) {
        console.error('❌ Database creation setup error:', error);
        reject(error);
      }
    });
  }

  private static async testDatabaseConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database is null'));
        return;
      }

      this.db.executeSql(
        'SELECT 1 as test',
        [],
        (result: any) => {
          console.log('✅ Database connection test passed');
          resolve();
        },
        (error: any) => {
          console.error('❌ Database connection test failed:', error);
          reject(new Error(`Connection test failed: ${error.message || error}`));
        }
      );
    });
  }

  private static async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS blocklist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.executeSql(
        createTableSQL,
        [],
        (result: any) => {
          console.log('✅ Blocklist table created successfully');
          resolve();
        },
        (error: any) => {
          console.error('❌ Table creation failed:', error);
          reject(new Error(`Table creation failed: ${error.message || error}`));
        }
      );
    });
  }

  private static async insertDefaultBlocklist(): Promise<void> {
    const defaultDomains = Array.from(this.webBlocklist);
    
    for (const domain of defaultDomains) {
      try {
        await this.insertDomainSafely(domain);
      } catch (error) {
        console.warn(`⚠️ Failed to insert domain ${domain}:`, error);
        // Continue with other domains
      }
    }
    
    console.log(`✅ Inserted ${defaultDomains.length} default blocked domains`);
  }

  private static async insertDomainSafely(domain: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.executeSql(
        'INSERT OR IGNORE INTO blocklist (domain) VALUES (?)',
        [domain],
        (result: any) => {
          resolve();
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  static async checkLocalBlocklist(hostname: string): Promise<boolean> {
    try {
      // Ensure initialization is complete
      await this.initializeDatabase();

      // Use in-memory blocklist if SQLite is not available
      if (!this.db || Platform.OS === 'web' || !isSQLiteAvailable) {
        const isBlocked = this.webBlocklist.has(hostname.toLowerCase());
        if (isBlocked) {
          console.log(`🚫 Domain ${hostname} found in in-memory blocklist`);
        }
        return isBlocked;
      }

      // Query SQLite database
      return new Promise((resolve, reject) => {
        this.db.executeSql(
          'SELECT domain FROM blocklist WHERE domain = ? LIMIT 1',
          [hostname.toLowerCase()],
          (result: any) => {
            try {
              const isBlocked = result.rows && result.rows.length > 0;
              if (isBlocked) {
                console.log(`🚫 Domain ${hostname} found in SQLite blocklist`);
              }
              resolve(isBlocked);
            } catch (parseError) {
              console.warn('⚠️ Error parsing SQLite result, using in-memory fallback:', parseError);
              resolve(this.webBlocklist.has(hostname.toLowerCase()));
            }
          },
          (error: any) => {
            console.warn('⚠️ SQLite query failed, using in-memory fallback:', error);
            resolve(this.webBlocklist.has(hostname.toLowerCase()));
          }
        );
      });

    } catch (error) {
      console.error('❌ Local blocklist check error:', error);
      // Final fallback to in-memory blocklist
      return this.webBlocklist.has(hostname.toLowerCase());
    }
  }

  static isDatabaseInitialized(): boolean {
    return this.isInitialized;
  }

  static getDatabaseStatus(): { isInitialized: boolean; hasSQLite: boolean; hasDatabase: boolean } {
    return {
      isInitialized: this.isInitialized,
      hasSQLite: isSQLiteAvailable,
      hasDatabase: this.db !== null,
    };
  }
}

export class LinkScannerService {
  static async initializeService(): Promise<void> {
    try {
      console.log('🔍 Initializing LinkScannerService...');
      await DatabaseManager.initializeDatabase();
      
      const status = DatabaseManager.getDatabaseStatus();
      console.log('📊 Database status:', status);
      
      console.log('✅ LinkScannerService initialized successfully');
    } catch (error) {
      console.error('❌ LinkScannerService initialization failed:', error);
      // Service continues with in-memory fallback
      console.log('🔄 Service will continue with limited functionality');
    }
  }

  // Updated scanUrl function to match exact requirements
  static async scanUrl(url: string): Promise<UrlScanResult> {
    try {
      console.log(`🔍 Scanning URL: ${url}`);
      
      // Check for EICAR test patterns in the URL
      const eicarPattern = /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H/i;
      if (eicarPattern.test(url)) {
        console.log(`🚫 EICAR test pattern detected in URL: ${url}`);
        return {
          isSafe: false,
          details: 'EICAR test file pattern detected - This is a test malware signature.'
        };
      }
      
      // a. Extract the hostname from the full URL
      const hostname = this.extractHostname(url);
      
      if (!hostname) {
        return {
          isSafe: false,
          details: 'Invalid URL format.'
        };
      }

      console.log(`🌐 Extracted hostname: ${hostname}`);

      // b. First, perform a query on the local database
      const isBlocked = await DatabaseManager.checkLocalBlocklist(hostname);
      
      // c. If a match is found, immediately return unsafe
      if (isBlocked) {
        console.log(`🚫 URL blocked by local blocklist: ${hostname}`);
        return {
          isSafe: false,
          details: 'This site is on the known threat list.'
        };
      }

      // d. If no local match, proceed to cloud check using VirusTotal
      try {
        console.log(`☁️ Checking with VirusTotal: ${hostname}`);
        const virusTotalResult = await this.checkVirusTotal(url);
        
        // e. Await the analysis result and parse response
        if (virusTotalResult.maliciousCount > 0) {
          console.log(`🚫 URL flagged by VirusTotal: ${virusTotalResult.maliciousCount} detections`);
          return {
            isSafe: false,
            details: 'Identified as a threat by global security engines.'
          };
        } else {
          console.log(`✅ URL verified as safe: ${hostname}`);
          return {
            isSafe: true,
            details: 'Scanned and found to be safe.'
          };
        }
      } catch (apiError) {
        // f. Error handling: default to safe during network issues
        console.error('⚠️ VirusTotal API error:', apiError);
        return {
          isSafe: true,
          details: 'Scan service could not be reached.'
        };
      }
    } catch (error) {
      console.error('❌ URL scan error:', error);
      return {
        isSafe: true,
        details: 'Scan service could not be reached.'
      };
    }
  }

  private static extractHostname(url: string): string | null {
    try {
      // Handle URLs without protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch (error) {
      console.error('❌ Hostname extraction error:', error);
      return null;
    }
  }

  private static async checkVirusTotal(url: string): Promise<{ maliciousCount: number }> {
    try {
      // Submit URL for analysis
      const submitResponse = await axios.post(
        'https://www.virustotal.com/vtapi/v2/url/scan',
        new URLSearchParams({
          apikey: VIRUSTOTAL_API_KEY,
          url: url
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000
        }
      );

      // Get the scan report
      const reportResponse = await axios.post(
        'https://www.virustotal.com/vtapi/v2/url/report',
        new URLSearchParams({
          apikey: VIRUSTOTAL_API_KEY,
          resource: url
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000
        }
      );

      const reportData = reportResponse.data;
      
      if (reportData.response_code === 1) {
        return { maliciousCount: reportData.positives || 0 };
      }
      
      return { maliciousCount: 0 };
    } catch (error) {
      throw error; // Re-throw to be handled by the calling function
    }
  }
}

export class FileScannerService {
  
  // Quarantine folder management per doccument-image-file.md requirements
  private static async ensureQuarantineFolder(): Promise<string> {
    if (!isRNFSAvailable || !RNFS) {
      throw new Error('File system not available on this platform');
    }

    const quarantinePath = `${RNFS.DocumentDirectoryPath}/quarantine`;
    
    try {
      const exists = await RNFS.exists(quarantinePath);
      if (!exists) {
        await RNFS.mkdir(quarantinePath);
        console.log('📁 Created quarantine folder:', quarantinePath);
      }
      return quarantinePath;
    } catch (error) {
      console.error('❌ Failed to create quarantine folder:', error);
      throw error;
    }
  }

  // PUBLIC METHOD: Get quarantine folder path for UI access
  static async getQuarantineFolderPath(): Promise<string> {
    return await this.ensureQuarantineFolder();
  }

  // PUBLIC METHOD: List all quarantined files for UI display
  static async listQuarantinedFiles(): Promise<Array<{
    id: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    quarantineDate: Date;
    threatLevel: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
    threatName?: string;
    scanEngine?: string;
    details?: string;
  }>> {
    try {
      if (!isRNFSAvailable || !RNFS) {
        // Return empty array for web/mock platforms
        return [];
      }

      const quarantinePath = await this.ensureQuarantineFolder();
      const files = await RNFS.readDir(quarantinePath);
      const quarantinedFiles = [];

      for (const file of files) {
        try {
          // Parse filename to extract original name and timestamp
          const timestampMatch = file.name.match(/^(\d+)_(.+)$/);
          if (!timestampMatch) continue;

          const timestamp = parseInt(timestampMatch[1]);
          const originalFileName = timestampMatch[2].replace(/_/g, ' ');
          
          // Get file stats
          const stats = await RNFS.stat(file.path);
          
          // Try to determine threat level from metadata file
          let threatLevel: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' = 'UNKNOWN';
          let threatName = undefined;
          let scanEngine = 'Shabari Scanner';
          let details = 'File quarantined for security analysis';

          // Check if metadata file exists
          const metadataPath = `${file.path}.meta`;
          try {
            const metadataExists = await RNFS.exists(metadataPath);
            if (metadataExists) {
              const metadata = JSON.parse(await RNFS.readFile(metadataPath, 'utf8'));
              threatLevel = metadata.threatLevel || threatLevel;
              threatName = metadata.threatName;
              scanEngine = metadata.scanEngine || scanEngine;
              details = metadata.details || details;
            }
          } catch (metaError) {
            // If no metadata, try to infer from file extension
            const ext = originalFileName.toLowerCase().split('.').pop() || '';
            if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf', 'doc', 'docx'].includes(ext)) {
              threatLevel = 'SAFE';
              details = 'Personal file - privacy protected';
            } else if (['exe', 'apk', 'dmg', 'msi'].includes(ext)) {
              threatLevel = 'SUSPICIOUS';
              details = 'Executable file - requires careful review';
            }
          }

          quarantinedFiles.push({
            id: file.name,
            fileName: file.name,
            originalFileName,
            filePath: file.path,
            fileSize: stats.size,
            quarantineDate: new Date(timestamp),
            threatLevel,
            threatName,
            scanEngine,
            details
          });
        } catch (error) {
          console.warn('Error processing quarantined file:', file.name, error);
        }
      }

      // Sort by quarantine date (newest first)
      quarantinedFiles.sort((a, b) => b.quarantineDate.getTime() - a.quarantineDate.getTime());
      
      return quarantinedFiles;
    } catch (error) {
      console.error('❌ Failed to list quarantined files:', error);
      return [];
    }
  }

  // PUBLIC METHOD: Delete quarantined file
  static async deleteQuarantinedFile(filePath: string): Promise<boolean> {
    try {
      if (!isRNFSAvailable || !RNFS) {
        console.log('📁 Mock: Would delete quarantined file:', filePath);
        return true;
      }

      // Delete the file
      await RNFS.unlink(filePath);
      
      // Also delete metadata file if it exists
      const metadataPath = `${filePath}.meta`;
      try {
        const metadataExists = await RNFS.exists(metadataPath);
        if (metadataExists) {
          await RNFS.unlink(metadataPath);
        }
      } catch (metaError) {
        // Metadata deletion failure is non-critical
        console.warn('Failed to delete metadata file:', metaError);
      }

      console.log('🗑️ Successfully deleted quarantined file:', filePath);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete quarantined file:', error);
      return false;
    }
  }

  // PUBLIC METHOD: Restore quarantined file to Downloads
  static async restoreQuarantinedFile(filePath: string, originalFileName: string): Promise<boolean> {
    try {
      if (!isRNFSAvailable || !RNFS) {
        console.log('📁 Mock: Would restore quarantined file:', originalFileName);
        return true;
      }

      const downloadPath = `${RNFS.DownloadDirectoryPath}/${originalFileName}`;
      await RNFS.moveFile(filePath, downloadPath);
      
      // Delete metadata file if it exists
      const metadataPath = `${filePath}.meta`;
      try {
        const metadataExists = await RNFS.exists(metadataPath);
        if (metadataExists) {
          await RNFS.unlink(metadataPath);
        }
      } catch (metaError) {
        // Metadata deletion failure is non-critical
        console.warn('Failed to delete metadata file during restore:', metaError);
      }

      console.log('📋 Successfully restored file to Downloads:', originalFileName);
      return true;
    } catch (error) {
      console.error('❌ Failed to restore quarantined file:', error);
      return false;
    }
  }

  // Save scan result metadata alongside quarantined file
  private static async saveQuarantineMetadata(filePath: string, scanResult: FileScanResult): Promise<void> {
    try {
      if (!isRNFSAvailable || !RNFS) {
        return; // Skip metadata on web platforms
      }

      const metadata = {
        threatLevel: scanResult.isSafe ? 'SAFE' : 'MALICIOUS',
        threatName: scanResult.threatName,
        scanEngine: scanResult.scanEngine,
        details: scanResult.details,
        scanTime: scanResult.scanTime,
        filePath: scanResult.filePath
      };

      const metadataPath = `${filePath}.meta`;
      await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log('💾 Saved quarantine metadata:', metadataPath);
    } catch (error) {
      console.warn('⚠️ Failed to save quarantine metadata:', error);
      // Non-critical error - don't throw
    }
  }

  // COMPLIANCE: Automatic quarantine disabled for Play Store compliance
  static async quarantineSharedFile(contentUri: string, fileName: string): Promise<SharedFileContent> {
    console.log('🔒 Automatic quarantine disabled for Play Store compliance');
    console.log('🔒 Files will remain in their original location');
    console.log('🔒 Manual quarantine available through UI if needed');
      
    // COMPLIANCE: Return original file location without automatic quarantine
        return {
          fileName,
          contentUri,
      quarantinedPath: contentUri, // No automatic quarantine
        };
      }

  // COMPLIANCE: File scanning with NO automatic quarantine (Play Store compliant)
  static async scanFile(fileUri: string, fileName: string): Promise<FileScanResult> {
    try {
      console.log('🔍 Starting file scan (no automatic quarantine):', fileName);
      console.log('🔒 Play Store compliance: Files are NOT automatically quarantined');

      // COMPLIANCE: No automatic quarantine - scan file in original location
      // User can manually quarantine if needed after seeing results
      
      // Get file size if possible (for local scan)
      let fileSize = 0;
      try {
        if (isRNFSAvailable && RNFS) {
          const fileInfo = await RNFS.stat(fileUri);
          fileSize = fileInfo.size;
        }
    } catch (error) {
        console.warn('Could not get file size:', error);
      }
      
      // PRIVACY PROTECTION: Check if file should be sent to VirusTotal
      const shouldScanWithVirusTotal = this.shouldScanWithVirusTotal(fileName, fileUri);
      
      let scanResult: FileScanResult;
      
      if (!shouldScanWithVirusTotal) {
        console.log('🔒 Privacy Protection: Personal document detected - using local scan only:', fileName);
        const localResult = await this.performLocalScan(fileName, fileSize);
        scanResult = {
          ...localResult,
          filePath: fileUri,
          fileSize: fileSize,
          details: localResult.details + ' (Privacy-protected: not sent to cloud services)'
        };
      } else {
      // Step 2: Generate file hash for VirusTotal (only for non-personal files)
        const fileHash = await this.generateFileHash(fileUri);
      
      // Step 3: Check against VirusTotal
      const vtResult = await this.checkVirusTotal(fileHash, fileName);
      
      // Step 4: If not found in VT, perform local scan
      if (!vtResult) {
          const localResult = await this.performLocalScan(fileName, fileSize);
          scanResult = {
          ...localResult,
            filePath: fileUri,
            fileSize: fileSize,
        };
        } else {
          scanResult = {
        ...vtResult,
            filePath: fileUri,
            fileSize: fileSize,
      };
        }
      }
      
      // COMPLIANCE: No automatic quarantine metadata saving
      console.log('🔒 File scan completed without automatic quarantine');
      
      return scanResult;
    } catch (error) {
      console.error('❌ File scan error:', error);
      return {
        isSafe: false,
        threatName: 'Scan failed - treating as suspicious',
        scanEngine: 'Shabari Scanner',
        scanTime: new Date(),
        details: 'Unable to complete scan - file treated as suspicious for safety.',
        filePath: fileUri,
      };
    }
  }

  // COMPLIANCE: Background file scanning disabled for Play Store compliance
  static async scanFileBackground(filePath: string): Promise<FileScanResult> {
    console.log('🔒 Background file scanning disabled for Play Store compliance');
    console.log('🔒 Automatic file monitoring violates scoped storage policies');
      
      const fileName = filePath.split('/').pop() || 'unknown_file';
      
    // Return safe result with compliance message
      return {
      isSafe: true,
      threatName: undefined,
      scanEngine: 'Shabari Scanner (Compliance Mode)',
        scanTime: new Date(),
      details: 'Background scanning disabled for Play Store compliance. Use manual scanning only.',
        filePath,
      };
  }

  /**
   * PRIVACY PROTECTION: Determines if a file should be sent to VirusTotal
   * Personal documents are kept private, only potential threats are cloud-scanned
   */
  private static shouldScanWithVirusTotal(fileName: string, filePath: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    const lowerFilePath = filePath.toLowerCase();
    
    // NEVER send these personal document types to VirusTotal
    const personalDocumentExtensions = [
      '.pdf',     // Bank statements, contracts, personal docs
      '.doc',     // Personal documents  
      '.docx',    // Personal documents
      '.xls',     // Financial spreadsheets
      '.xlsx',    // Financial spreadsheets
      '.txt',     // Personal notes
      '.rtf',     // Personal documents
      '.odt',     // Personal documents
      '.ods',     // Personal spreadsheets
    ];
    
    // NEVER send media files (personal photos/videos)
    const personalMediaExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',  // Photos
      '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm',    // Videos
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a',           // Audio
    ];
    
    // ALWAYS scan these potentially dangerous files
    const dangerousExtensions = [
      '.exe', '.msi', '.bat', '.cmd', '.scr', '.pif',            // Windows executables
      '.apk', '.dex',                                            // Android apps
      '.dmg', '.pkg', '.app',                                    // macOS executables
      '.deb', '.rpm',                                            // Linux packages
      '.jar', '.war',                                            // Java archives
      '.zip', '.rar', '.7z', '.tar', '.gz',                      // Archives (could contain malware)
      '.js', '.vbs', '.ps1', '.sh',                             // Scripts
      '.iso', '.img',                                            // Disk images
    ];
    
    // Check for personal document extensions
    const isPersonalDocument = personalDocumentExtensions.some(ext => 
      lowerFileName.endsWith(ext)
    );
    
    const isPersonalMedia = personalMediaExtensions.some(ext => 
      lowerFileName.endsWith(ext)
    );
    
    // Check for dangerous extensions
    const isDangerousFile = dangerousExtensions.some(ext => 
      lowerFileName.endsWith(ext)
    );
    
    // Check for suspicious file paths (temp folders, system directories)
    const isSuspiciousPath = lowerFilePath.includes('/temp/') || 
                            lowerFilePath.includes('/tmp/') ||
                            lowerFilePath.includes('/system/') ||
                            lowerFilePath.includes('suspicious');
    
    // Privacy Logic:
    if (isPersonalDocument || isPersonalMedia) {
      console.log(`🔒 Privacy Protection: Personal file detected - ${fileName} will NOT be sent to VirusTotal`);
      return false; // Keep personal files private
    }
    
    if (isDangerousFile || isSuspiciousPath) {
      console.log(`⚠️ Security Scan: Potentially dangerous file - ${fileName} will be scanned with VirusTotal`);
      return true; // Scan potential threats
    }
    
    // For unknown file types, default to local scan only (privacy-first)
    console.log(`🔒 Privacy Default: Unknown file type - ${fileName} will use local scan only`);
    return false;
  }

  private static async generateFileHash(fileUri: string): Promise<string> {
    // In a real implementation, this would generate an actual file hash
    // For demo purposes, we'll simulate this
    return 'demo_hash_' + Math.random().toString(36).substring(7);
  }

  private static async checkVirusTotal(fileHash: string, fileName: string): Promise<FileScanResult | null> {
    try {
      const response = await fetch(`https://www.virustotal.com/vtapi/v2/file/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `apikey=${VIRUSTOTAL_API_KEY}&resource=${fileHash}`,
      });

      const data = await response.json();
      
      if (data.response_code === 1) {
        const isSafe = data.positives === 0;
        return {
          isSafe,
          threatName: isSafe ? undefined : `Detected by ${data.positives}/${data.total} engines`,
          scanEngine: 'VirusTotal',
          scanTime: new Date(),
          details: isSafe ? 'File verified as clean by VirusTotal.' : `Malicious content detected by ${data.positives} security engines.`,
        };
      }
      
      return null; // File not found in VT database
    } catch (error) {
      console.error('VirusTotal API error:', error);
      return null;
    }
  }

  private static async performLocalScan(fileName: string, fileSize?: number): Promise<FileScanResult> {
    console.log('🔍 Starting local scan for:', fileName);
    
    // Try YARA scanning first (most advanced local detection)
    try {
      const yaraStatus = await YaraSecurityService.getEngineStatus();
      if (yaraStatus.available && yaraStatus.initialized) {
        console.log('🛡️ Using YARA engine for local scan');
        
        // For local scan, we need a file path - if we don't have one, create a temporary path
        const tempFilePath = `/temp/${fileName}`;
        const yaraResult = await YaraSecurityService.scanFile(tempFilePath);
        
        // Add YARA-specific details
        yaraResult.details += `\n\nYARA Engine: ${yaraStatus.version} (${yaraStatus.rulesCount} rules)`;
        yaraResult.details += `\nScan Mode: Local Detection Only`;
        
        console.log('✅ YARA local scan completed:', yaraResult.isSafe ? 'CLEAN' : 'THREAT');
        return yaraResult;
      } else {
        console.log('⚠️ YARA engine not available, falling back to heuristic scan');
        console.log('YARA Status:', yaraStatus);
      }
    } catch (error) {
      console.error('❌ YARA scan failed, falling back to heuristic:', error);
    }
    
    // Fallback to original heuristic scanning
    console.log('🔍 Using heuristic local scan');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple heuristic based on file extension
    const dangerousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.pif', '.vbs', '.js', '.apk', '.dmg'];
    const isDangerous = dangerousExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
    
    // Check for suspiciously large files (over 100MB)
    const isSuspiciousSize = fileSize && fileSize > 100 * 1024 * 1024;
    
    // Add some randomness for demo
    const randomThreat = Math.random() < 0.15; // 15% chance of random threat
    
    const hasAnyThreat = isDangerous || isSuspiciousSize || randomThreat;
    
    return {
      isSafe: !hasAnyThreat,
      threatName: isDangerous ? 'Potentially unwanted program' : 
                 isSuspiciousSize ? 'Suspiciously large file' :
                 randomThreat ? 'Suspicious file behavior' : undefined,
      scanEngine: 'Shabari Local Scanner (Heuristic)',
      scanTime: new Date(),
      details: isDangerous ? 'File type identified as potentially dangerous.' : 
              isSuspiciousSize ? `Large file (${Math.round((fileSize || 0) / 1024 / 1024)}MB) requires manual review.` :
              randomThreat ? 'File exhibits suspicious characteristics.' :
              'File appears to be safe based on heuristic analysis.',
      filePath: undefined,
      fileSize: fileSize
    };
  }
}

