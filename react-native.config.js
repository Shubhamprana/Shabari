module.exports = {
  dependencies: {
    'react-native-yara-engine': {
      platforms: {
        android: {
          sourceDir: __dirname + '/react-native-yara-engine/android',
          packageImportPath: 'import com.shabari.yara.YaraPackage;',
          packageInstance: 'new YaraPackage()',
        },
      },
    },
    'react-native-app-permission-scanner': {
      platforms: {
        android: {
          sourceDir: __dirname + '/react-native-app-permission-scanner/android',
          packageImportPath: 'import com.shabari.appscanner.AppPermissionScannerPackage;',
          packageInstance: 'new AppPermissionScannerPackage()',
        },
      },
    },
    // Disable Android linking for proxy engine to avoid VPN service merging
    'react-native-proxy-engine': {
      platforms: {
        android: null,
      },
    },
  },
}; 