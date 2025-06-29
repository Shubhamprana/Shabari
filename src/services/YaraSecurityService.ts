import { Platform } from 'react-native';
import { FileScanResult } from './ScannerService';

// YARA Module Interface
interface YaraScanResult {
  isSafe: boolean;
  threatName: string;
  threatCategory: string;
  severity: string;
  matchedRules: string[];
  scanTime: number;
  fileSize: number;
  scanEngine: string;
  details: string;
}

interface YaraEngine {
  initializeEngine(): Promise<string>;
  scanFile(filePath: string): Promise<YaraScanResult>;
  getEngineVersion(): Promise<string>;
  getLoadedRulesCount(): Promise<number>;
}

// Mock YARA Engine for development
class MockYaraEngine implements YaraEngine {
  async initializeEngine(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('🎭 Mock YARA Engine initialized');
    return 'Mock YARA v4.5.0 initialized successfully';
  }

  async scanFile(filePath: string): Promise<YaraScanResult> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const fileName = filePath.split('/').pop() || 'unknown';
    const isSuspicious = fileName.toLowerCase().includes('malware') || 
                        fileName.toLowerCase().includes('virus') ||
                        fileName.toLowerCase().includes('trojan');
    
    return {
      isSafe: !isSuspicious,
      threatName: isSuspicious ? 'Mock_Detected_Threat' : '',
      threatCategory: isSuspicious ? 'malware' : '',
      severity: isSuspicious ? 'medium' : 'safe',
      matchedRules: isSuspicious ? ['Mock_Rule_1'] : [],
      scanTime: Math.floor(Math.random() * 50) + 10,
      fileSize: Math.floor(Math.random() * 1000000) + 1000,
      scanEngine: 'Mock YARA v4.5.0',
      details: isSuspicious ? 'Mock threat detected for testing' : 'File appears clean'
    };
  }

  async getEngineVersion(): Promise<string> {
    return 'Mock YARA v4.5.0';
  }

  async getLoadedRulesCount(): Promise<number> {
    return 127;
  }
}

// YARA Engine instance
let YaraEngineInstance: YaraEngine | null = null;
let isNativeYaraAvailable = false;

// Try to load native YARA module
try {
  if (Platform.OS === 'android') {
    const { default: NativeYaraEngine } = require('react-native-yara-engine');
    YaraEngineInstance = NativeYaraEngine;
    isNativeYaraAvailable = true;
    console.log('✅ Native YARA Engine loaded successfully');
  }
} catch (error) {
  console.log('📱 Native YARA not available, using mock engine');
  YaraEngineInstance = new MockYaraEngine();
  isNativeYaraAvailable = false;
}

if (!YaraEngineInstance) {
  YaraEngineInstance = new MockYaraEngine();
}

export class YaraSecurityService {
  private static initialized = false;
  private static engineInfo = { version: '', rulesCount: 0 };

  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('🔍 Initializing YARA Security Service...');
      
      if (!YaraEngineInstance) {
        throw new Error('YARA Engine not available');
      }

      const result = await YaraEngineInstance.initializeEngine();
      console.log('✅ YARA Engine initialized:', result);

      const [version, rulesCount] = await Promise.all([
        YaraEngineInstance.getEngineVersion(),
        YaraEngineInstance.getLoadedRulesCount()
      ]);

      this.engineInfo = { version, rulesCount };
      this.initialized = true;

      console.log(`🛡️ YARA ${version} ready with ${rulesCount} detection rules`);
      return true;

    } catch (error) {
      console.error('❌ YARA initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  static async scanFile(filePath: string): Promise<FileScanResult> {
    try {
      const isReady = await this.initialize();
      if (!isReady || !YaraEngineInstance) {
        return this.createFallbackResult(filePath, 'YARA engine not available');
      }

      console.log('🔍 YARA scanning file:', filePath);
      const yaraResult = await YaraEngineInstance.scanFile(filePath);

      const result: FileScanResult = {
        isSafe: yaraResult.isSafe,
        threatName: yaraResult.threatName || undefined,
        scanEngine: `${yaraResult.scanEngine} (Local)`,
        scanTime: new Date(),
        details: yaraResult.details,
        filePath: filePath,
        fileSize: yaraResult.fileSize
      };

      console.log(`🛡️ YARA scan completed:`, {
        isSafe: result.isSafe,
        threatName: result.threatName
      });

      return result;

    } catch (error) {
      console.error('❌ YARA file scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createFallbackResult(filePath, `YARA scan failed: ${errorMessage}`);
    }
  }

  static async getEngineStatus(): Promise<{
    available: boolean;
    initialized: boolean;
    native: boolean;
    version: string;
    rulesCount: number;
  }> {
    return {
      available: YaraEngineInstance !== null,
      initialized: this.initialized,
      native: isNativeYaraAvailable,
      version: this.engineInfo.version || 'Unknown',
      rulesCount: this.engineInfo.rulesCount || 0
    };
  }

  private static createFallbackResult(filePath: string, error: string): FileScanResult {
    return {
      isSafe: false,
      threatName: 'Scan Failed',
      scanEngine: 'YARA Fallback',
      scanTime: new Date(),
      details: `YARA scan unavailable: ${error}`,
      filePath: filePath
    };
  }
} 