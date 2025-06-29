module.exports = {
  dependencies: {
    'react-native-yara-engine': {
      platforms: {
        android: {
          sourceDir: __dirname + '/react-native-yara-engine/android',
          packageImportPath: 'import com.shabari.yara.YaraModule;',
          packageInstance: 'new YaraModule()',
        },
      },
    },
  },
}; 