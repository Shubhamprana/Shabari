import { NativeModules, Platform } from 'react-native';

// Web compatibility - provide mock implementation for web
const YaraEngine = Platform.OS === 'web' 
  ? {
      initializeEngine: () => Promise.resolve('Mock YARA Engine v4.5.0 initialized'),
      loadRules: () => Promise.resolve('127 rules loaded'),
      scanFile: (filePath) => Promise.resolve({
        isSafe: !filePath.includes('malicious'),
        threatName: filePath.includes('malicious') ? 'Simulated.Threat' : '',
        threatCategory: filePath.includes('malicious') ? 'trojan' : '',
        severity: filePath.includes('malicious') ? 'high' : 'none',
        matchedRules: filePath.includes('malicious') ? ['mock_rule_1'] : [],
        scanTime: 50,
        fileSize: 1024,
        scanEngine: 'Mock YARA v4.5.0',
        details: 'Mock scan result for web testing'
      }),
      scanMemory: (data) => Promise.resolve({
        isSafe: true,
        threatName: '',
        threatCategory: '',
        severity: 'none',
        matchedRules: [],
        scanTime: 25,
        fileSize: data.length,
        scanEngine: 'Mock YARA v4.5.0',
        details: 'Mock memory scan result'
      }),
      updateRules: () => Promise.resolve('Rules updated successfully'),
      getEngineVersion: () => Promise.resolve('4.5.0-mock'),
      getLoadedRulesCount: () => Promise.resolve(127)
    }
  : NativeModules.YaraEngine;

export default YaraEngine;

