import { NativeModules, Platform } from 'react-native';

// Enhanced Mock implementation for fallback
const MockYaraEngine = {
  initializeEngine: () => {
    console.log('🎭 Mock YARA Engine initialized');
    return Promise.resolve('Mock YARA Engine v4.5.0 initialized');
  },
  
  loadRules: () => {
    console.log('📋 Mock YARA rules loaded');
    return Promise.resolve('127 rules loaded');
  },
  
  scanFile: (filePath) => {
    console.log('🔍 Mock scanning file:', filePath);
    
    const fileName = filePath.split('/').pop() || 'unknown';
    const fileNameLower = fileName.toLowerCase();
    
    // Enhanced detection patterns
    const malwarePatterns = [
      'malware', 'virus', 'trojan', 'backdoor', 'rootkit', 'spyware', 'adware',
      'ransomware', 'keylogger', 'botnet', 'worm', 'exploit', 'phishing'
    ];
    
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'
    ];
    
    let isSafe = true;
    let threatName = '';
    let threatCategory = '';
    let severity = 'none';
    let matchedRules = [];
    let details = 'File appears clean';
    
    // Check for malware patterns in filename
    for (const pattern of malwarePatterns) {
      if (fileNameLower.includes(pattern)) {
        isSafe = false;
        threatName = `Detected.${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`;
        threatCategory = 'malware';
        severity = 'high';
        matchedRules.push(`mock_${pattern}_rule`);
        details = `Suspicious filename pattern detected: ${pattern}`;
        break;
      }
    }
    
    // Check for suspicious file extensions
    if (isSafe) {
      for (const ext of suspiciousExtensions) {
        if (fileNameLower.endsWith(ext)) {
          isSafe = false;
          threatName = 'Suspicious.Executable';
          threatCategory = 'suspicious';
          severity = 'medium';
          matchedRules.push('mock_executable_rule');
          details = `Potentially suspicious executable file: ${ext}`;
          break;
        }
      }
    }
    
    // Simulate scan time
    const scanTime = Math.floor(Math.random() * 100) + 50;
    
    return Promise.resolve({
      isSafe,
      threatName,
      threatCategory,
      severity,
      matchedRules,
      scanTime,
      fileSize: Math.floor(Math.random() * 1000000) + 1000,
    scanEngine: 'Mock YARA v4.5.0',
      details
    });
  },
  
  scanMemory: (data) => {
    console.log('🧠 Mock scanning memory, size:', data.length);
    
    const dataStr = String.fromCharCode.apply(null, data.slice(0, Math.min(data.length, 1000)));
    const dataLower = dataStr.toLowerCase();
    
    // Enhanced pattern detection for memory
    const patterns = [
      'malware', 'virus', 'trojan', 'exploit', 'shell32', 'eval(',
      'unescape(', 'fromcharcode', 'createobject', 'wscript.shell'
    ];
    
    let isSafe = true;
    let threatName = '';
    let matchedRules = [];
    let details = 'Memory appears clean';
    
    for (const pattern of patterns) {
      if (dataLower.includes(pattern)) {
        isSafe = false;
        threatName = 'Memory.Malware';
        matchedRules.push(`mock_memory_${pattern}_rule`);
        details = `Suspicious pattern in memory: ${pattern}`;
        break;
      }
    }
    
    return Promise.resolve({
      isSafe,
      threatName: isSafe ? '' : threatName,
      threatCategory: isSafe ? '' : 'malware',
      severity: isSafe ? 'none' : 'medium',
      matchedRules,
      scanTime: Math.floor(Math.random() * 50) + 25,
    fileSize: data.length,
    scanEngine: 'Mock YARA v4.5.0',
      details
    });
  },
  
  updateRules: () => {
    console.log('🔄 Mock YARA rules updated');
    return Promise.resolve('Rules updated successfully');
  },
  
  getEngineVersion: () => Promise.resolve('4.5.0-mock'),
  getLoadedRulesCount: () => Promise.resolve(127)
};

// Determine which engine to use with priority on native
let YaraEngine;
let engineType = 'unknown';

try {
if (Platform.OS === 'web') {
  // Use mock for web platform
  YaraEngine = MockYaraEngine;
    engineType = 'mock-web';
    console.log('🌐 Using Mock YARA Engine for web platform');
} else if (NativeModules.YaraEngine) {
    // Native module is available, but check if native library is loaded
  YaraEngine = NativeModules.YaraEngine;
    console.log('📱 React Native YARA module loaded, checking native library...');
    
    // Check if native library is actually available
    YaraEngine.isNativeEngineAvailable()
      .then((isNative) => {
        if (isNative) {
          engineType = 'native';
          console.log('✅ Native YARA Engine loaded successfully');
          console.log('🛡️ Using real YARA malware detection engine');
        } else {
          engineType = 'mock-native';
          console.log('⚠️ Native YARA library not available, using enhanced mock');
          console.log('🎭 Mock implementation provides basic pattern detection');
        }
        
        // Update engine type information
        YaraEngine._engineType = engineType;
        YaraEngine._isNative = isNative;
      })
      .catch((error) => {
        console.warn('⚠️ Could not check native engine availability:', error);
        engineType = 'mock-fallback';
        YaraEngine._engineType = engineType;
        YaraEngine._isNative = false;
      });
    
    // Initial setup - assume mock until we verify
    engineType = 'mock-native';
    
    // Test native engine initialization
    YaraEngine.initializeEngine()
      .then(() => {
        console.log('🛡️ YARA Engine initialized and ready');
      })
      .catch((error) => {
        console.warn('⚠️ YARA Engine failed to initialize:', error);
        console.log('🔄 Engine will use available implementation (native or mock)');
      });
} else {
  // Fallback to mock if native module not available
    console.warn('📱 Native YARA Engine module not available, using mock implementation');
    YaraEngine = MockYaraEngine;
    engineType = 'mock-fallback';
  }
} catch (error) {
  console.error('❌ Error loading YARA Engine:', error);
  YaraEngine = MockYaraEngine;
  engineType = 'mock-error';
}

// Add engine type information to the exported engine
YaraEngine._engineType = engineType;
YaraEngine._isNative = engineType === 'native';

export default YaraEngine;

