import * as FileSystem from 'expo-file-system';

// Check if RNFS is available with enhanced error handling
let RNFS: any = null;
let isRNFSAvailable = false;
let rnfsError: string | null = null;

try {
  RNFS = require('react-native-fs');
  isRNFSAvailable = true;
  console.log('✅ RNFS loaded successfully for QuarantineService');
} catch (error) {
  rnfsError = error instanceof Error ? error.message : 'Unknown RNFS error';
  console.log('⚠️ RNFS not available - using Expo FileSystem for QuarantineService:', rnfsError);
}

export interface QuarantinedFile {
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
  metadata?: any;
}

export interface QuarantineResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Unified QuarantineService to handle all quarantine operations consistently
 * Uses RNFS when available, falls back to Expo FileSystem
 */
export class QuarantineService {
  private static instance: QuarantineService;
  private quarantinePath: string;

  private constructor() {
    // Use RNFS path if available, otherwise use Expo FileSystem path
    this.quarantinePath = isRNFSAvailable && RNFS ?
      `${RNFS.DocumentDirectoryPath}/quarantine/` :
      `${FileSystem.documentDirectory}quarantine/`;
  }

  static getInstance(): QuarantineService {
    if (!QuarantineService.instance) {
      QuarantineService.instance = new QuarantineService();
    }
    return QuarantineService.instance;
  }

  /**
   * Get the quarantine directory path
   */
  getQuarantinePath(): string {
    return this.quarantinePath;
  }

  /**
   * Ensure quarantine directory exists
   */
  async ensureQuarantineDirectory(): Promise<boolean> {
    try {
      if (isRNFSAvailable && RNFS) {
        // Use RNFS
        const exists = await RNFS.exists(this.quarantinePath);
        if (!exists) {
          await RNFS.mkdir(this.quarantinePath);
          console.log('📁 Created RNFS quarantine directory:', this.quarantinePath);
        }
      } else {
        // Use Expo FileSystem
        const dirInfo = await FileSystem.getInfoAsync(this.quarantinePath);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.quarantinePath, { intermediates: true });
          console.log('📁 Created Expo FileSystem quarantine directory:', this.quarantinePath);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to create quarantine directory:', error);
      return false;
    }
  }

  /**
   * Quarantine a file from any source
   */
  async quarantineFile(
    sourcePath: string,
    originalFileName: string,
    scanResult?: any
  ): Promise<QuarantineResult> {
    try {
      console.log(`🔒 Quarantining file: ${originalFileName} from ${sourcePath}`);

      // Ensure quarantine directory exists
      const dirCreated = await this.ensureQuarantineDirectory();
      if (!dirCreated) {
        return { success: false, error: 'Failed to create quarantine directory' };
      }

      // Generate unique quarantine filename
      const timestamp = Date.now() + Math.floor(Math.random() * 1000);
      const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const quarantineFileName = `${timestamp}_${sanitizedFileName}`;

      if (isRNFSAvailable && RNFS) {
        // Use RNFS for file operations
        const quarantineFullPath = `${this.quarantinePath}${quarantineFileName}`;

        // Check if source file exists
        const sourceExists = await RNFS.exists(sourcePath);
        if (!sourceExists) {
          return { success: false, error: 'Source file does not exist' };
        }

        // Copy file to quarantine (don't move to avoid issues if file is still needed)
        await RNFS.copyFile(sourcePath, quarantineFullPath);

        // Save metadata if provided
        if (scanResult) {
          await this.saveMetadata(quarantineFileName, scanResult);
        }

        console.log(`✅ File quarantined with RNFS: ${quarantineFileName}`);
        return { success: true, filePath: quarantineFullPath };

      } else {
        // Use Expo FileSystem
        const quarantineFullPath = `${this.quarantinePath}${quarantineFileName}`;

        // Check if source file exists
        const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
        if (!sourceInfo.exists) {
          return { success: false, error: 'Source file does not exist' };
        }

        // Copy file to quarantine
        await FileSystem.copyAsync({
          from: sourcePath,
          to: quarantineFullPath
        });

        // Save metadata if provided
        if (scanResult) {
          await this.saveMetadataExpo(quarantineFileName, scanResult);
        }

        console.log(`✅ File quarantined with Expo FileSystem: ${quarantineFileName}`);
        return { success: true, filePath: quarantineFullPath };
      }

    } catch (error) {
      console.error('❌ Error quarantining file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a quarantined file
   */
  async deleteQuarantinedFile(filePath: string): Promise<QuarantineResult> {
    try {
      console.log(`🗑️ Deleting quarantined file: ${filePath}`);

      if (isRNFSAvailable && RNFS) {
        // Use RNFS
        const exists = await RNFS.exists(filePath);
        if (!exists) {
          return { success: false, error: 'File does not exist' };
        }

        await RNFS.unlink(filePath);

        // Also delete metadata file if it exists
        const metadataPath = `${filePath}.meta`;
        try {
          const metadataExists = await RNFS.exists(metadataPath);
          if (metadataExists) {
            await RNFS.unlink(metadataPath);
          }
        } catch (metaError) {
          console.warn('⚠️ Failed to delete metadata file (non-critical):', metaError);
        }

      } else {
        // Use Expo FileSystem
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
          return { success: false, error: 'File does not exist' };
        }

        await FileSystem.deleteAsync(filePath, { idempotent: true });

        // Also delete metadata file if it exists
        const metadataPath = `${filePath}.meta`;
        try {
          const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
          if (metadataInfo.exists) {
            await FileSystem.deleteAsync(metadataPath, { idempotent: true });
          }
        } catch (metaError) {
          console.warn('⚠️ Failed to delete metadata file (non-critical):', metaError);
        }
      }

      console.log(`✅ Quarantined file deleted: ${filePath}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting quarantined file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Restore a quarantined file to Downloads folder
   */
  async restoreQuarantinedFile(
    filePath: string,
    originalFileName: string,
    threatLevel: string
  ): Promise<QuarantineResult> {
    try {
      // Only allow restoration of safe files
      if (threatLevel === 'MALICIOUS') {
        return { success: false, error: 'Cannot restore malicious files for safety' };
      }

      console.log(`🔄 Restoring quarantined file: ${originalFileName}`);

      if (isRNFSAvailable && RNFS) {
        // Use RNFS
        const exists = await RNFS.exists(filePath);
        if (!exists) {
          return { success: false, error: 'Quarantined file does not exist' };
        }

        // Create Downloads directory if it doesn't exist
        const downloadsPath = `${RNFS.ExternalDirectoryPath}/Download/`;
        const downloadsExists = await RNFS.exists(downloadsPath);
        if (!downloadsExists) {
          await RNFS.mkdir(downloadsPath);
        }

        const restorePath = `${downloadsPath}${originalFileName}`;

        // Move file back to Downloads
        await RNFS.moveFile(filePath, restorePath);

        // Delete metadata file
        const metadataPath = `${filePath}.meta`;
        try {
          const metadataExists = await RNFS.exists(metadataPath);
          if (metadataExists) {
            await RNFS.unlink(metadataPath);
          }
        } catch (metaError) {
          console.warn('⚠️ Failed to delete metadata file during restore:', metaError);
        }

      } else {
        // Use Expo FileSystem
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
          return { success: false, error: 'Quarantined file does not exist' };
        }

        // For Expo FileSystem, we can't easily access external storage
        // Just delete the quarantined file (user can re-download if needed)
        await FileSystem.deleteAsync(filePath, { idempotent: true });

        console.log('✅ File restored (deleted from quarantine) - user can re-download if needed');
        return { success: true };
      }

      console.log(`✅ File restored to Downloads: ${originalFileName}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error restoring quarantined file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List all quarantined files
   */
  async listQuarantinedFiles(): Promise<QuarantinedFile[]> {
    try {
      console.log('📋 Listing quarantined files...');

      if (isRNFSAvailable && RNFS) {
        // Use RNFS
        const exists = await RNFS.exists(this.quarantinePath);
        if (!exists) {
          console.log('📁 Quarantine directory does not exist');
          return [];
        }

        const files = await RNFS.readDir(this.quarantinePath);
        const quarantinedFiles: QuarantinedFile[] = [];

        for (const file of files) {
          try {
            // Skip metadata files
            if (file.name.endsWith('.meta')) {
              continue;
            }

            // Parse filename to extract original name and timestamp
            const timestampMatch = file.name.match(/^(\d+)_(.+)$/);
            if (!timestampMatch) continue;

            const timestamp = parseInt(timestampMatch[1]);
            const originalFileName = timestampMatch[2].replace(/_/g, ' ');

            // Get file stats
            const stats = await RNFS.stat(file.path);

            // Try to read metadata
            let threatLevel: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' = 'UNKNOWN';
            let threatName: string | undefined;
            let scanEngine = 'Shabari Scanner';
            let details = 'File quarantined for security analysis';
            let metadata: any = {};

            const metadataPath = `${file.path}.meta`;
            try {
              const metadataExists = await RNFS.exists(metadataPath);
              if (metadataExists) {
                const metadataContent = await RNFS.readFile(metadataPath, 'utf8');
                metadata = JSON.parse(metadataContent);
                threatLevel = metadata.threatLevel || threatLevel;
                threatName = metadata.threatName;
                scanEngine = metadata.scanEngine || scanEngine;
                details = metadata.details || details;
              }
            } catch (metaError) {
              console.warn('⚠️ Could not read metadata for:', file.name);
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
              details,
              metadata
            });

          } catch (error) {
            console.warn(`⚠️ Error processing quarantined file ${file.name}:`, error);
          }
        }

        // Sort by quarantine date (newest first)
        quarantinedFiles.sort((a, b) => b.quarantineDate.getTime() - a.quarantineDate.getTime());

        console.log(`📋 Found ${quarantinedFiles.length} quarantined files`);
        return quarantinedFiles;

      } else {
        // Use Expo FileSystem (limited functionality)
        const dirInfo = await FileSystem.getInfoAsync(this.quarantinePath);
        if (!dirInfo.exists) {
          console.log('📁 Quarantine directory does not exist');
          return [];
        }

        const files = await FileSystem.readDirectoryAsync(this.quarantinePath);
        const quarantinedFiles: QuarantinedFile[] = [];

        for (const fileName of files) {
          try {
            // Skip metadata files
            if (fileName.endsWith('.meta')) {
              continue;
            }

            const filePath = `${this.quarantinePath}${fileName}`;

            // Parse filename to extract original name and timestamp
            const timestampMatch = fileName.match(/^(\d+)_(.+)$/);
            if (!timestampMatch) continue;

            const timestamp = parseInt(timestampMatch[1]);
            const originalFileName = timestampMatch[2].replace(/_/g, ' ');

            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(filePath);

            // Type guard to check if size property exists
            const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
            
            quarantinedFiles.push({
              id: fileName,
              fileName,
              originalFileName,
              filePath,
              fileSize: fileSize || 0,
              quarantineDate: new Date(timestamp),
              threatLevel: 'UNKNOWN',
              scanEngine: 'Shabari Scanner',
              details: 'File quarantined via Expo FileSystem'
            });

          } catch (error) {
            console.warn(`⚠️ Error processing quarantined file ${fileName}:`, error);
          }
        }

        console.log(`📋 Found ${quarantinedFiles.length} quarantined files (Expo FileSystem)`);
        return quarantinedFiles;
      }

    } catch (error) {
      console.error('❌ Error listing quarantined files:', error);
      return [];
    }
  }

  /**
   * Save metadata using RNFS
   */
  private async saveMetadata(fileName: string, scanResult: any): Promise<void> {
    if (!isRNFSAvailable || !RNFS) return;

    try {
      const metadata = {
        threatLevel: scanResult.isSafe ? 'SAFE' : 'MALICIOUS',
        threatName: scanResult.threatName,
        scanEngine: scanResult.scanEngine,
        details: scanResult.details,
        scanTime: scanResult.scanTime,
        filePath: scanResult.filePath,
        fileSize: scanResult.fileSize
      };

      const metadataPath = `${this.quarantinePath}${fileName}.meta`;
      await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log('💾 Saved quarantine metadata:', metadataPath);
    } catch (error) {
      console.warn('⚠️ Failed to save quarantine metadata:', error);
    }
  }

  /**
   * Save metadata using Expo FileSystem
   */
  private async saveMetadataExpo(fileName: string, scanResult: any): Promise<void> {
    try {
      const metadata = {
        threatLevel: scanResult.isSafe ? 'SAFE' : 'MALICIOUS',
        threatName: scanResult.threatName,
        scanEngine: scanResult.scanEngine,
        details: scanResult.details,
        scanTime: scanResult.scanTime,
        filePath: scanResult.filePath,
        fileSize: scanResult.fileSize
      };

      const metadataPath = `${this.quarantinePath}${fileName}.meta`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('💾 Saved quarantine metadata (Expo):', metadataPath);
    } catch (error) {
      console.warn('⚠️ Failed to save quarantine metadata (Expo):', error);
    }
  }
}

export default QuarantineService;
