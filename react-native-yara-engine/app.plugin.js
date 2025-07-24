const { withPlugins, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

function withYaraEngine(config) {
  return withPlugins(config, [
    // Android configuration
    (config) => {
      // Inject react-native-yara-engine into settings.gradle and build.gradle
      const { withSettingsGradle, withAppBuildGradle } = require('@expo/config-plugins');

      config = withSettingsGradle(config, (gradleConfig) => {
        if (!gradleConfig?.modResults?.contents.includes("react-native-yara-engine")) {
          gradleConfig.modResults.contents += `\ninclude ':react-native-yara-engine'\nproject(':react-native-yara-engine').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-yara-engine/android')\n`;
        }
        return gradleConfig;
      });

      config = withAppBuildGradle(config, (gradleConfig) => {
        if (!gradleConfig?.modResults?.contents.includes("react-native-yara-engine")) {
          gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
            /dependencies \{[\s\S]*?\}/m,
            (match) => {
              if (match.includes("react-native-yara-engine")) return match; // already added
              return match.replace(/dependencies \{/, `dependencies {\n    implementation project(':react-native-yara-engine')`);
            }
          );
        }
        return gradleConfig;
      });

      return withDangerousMod(config, [
        'android',
        async (config) => {
          const androidManifestPath = path.join(
            config.modRequest.platformProjectRoot,
            'app',
            'src',
            'main',
            'AndroidManifest.xml'
          );
          
          // Ensure the YARA engine has necessary permissions
          // (Already handled by main app permissions)
          
          return config;
        },
      ]);
    },
    
    // Add YaraPackage to MainApplication
    (config) => {
      return withMainApplication(config, async (config) => {
        // Try both Java and Kotlin files
        const mainApplicationJavaPath = path.join(
          config.modRequest.platformProjectRoot,
          'app',
          'src',
          'main',
          'java',
          'com',
          'shabari',
          'app',
          'MainApplication.java'
        );
        
        const mainApplicationKotlinPath = path.join(
          config.modRequest.platformProjectRoot,
          'app',
          'src',
          'main',
          'java',
          'com',
          'shabari',
          'app',
          'MainApplication.kt'
        );
        
        let mainApplicationPath = null;
        let isKotlin = false;
        
        if (fs.existsSync(mainApplicationJavaPath)) {
          mainApplicationPath = mainApplicationJavaPath;
          isKotlin = false;
        } else if (fs.existsSync(mainApplicationKotlinPath)) {
          mainApplicationPath = mainApplicationKotlinPath;
          isKotlin = true;
        }
        
        if (mainApplicationPath) {
          let mainApplicationContent = fs.readFileSync(mainApplicationPath, 'utf-8');
          
          // Add import if not present
          if (!mainApplicationContent.includes('import com.shabari.yara.YaraPackage')) {
            const importIndex = mainApplicationContent.lastIndexOf('import');
            const endOfImport = mainApplicationContent.indexOf('\n', importIndex);
            mainApplicationContent = 
              mainApplicationContent.slice(0, endOfImport + 1) +
              '\n// Import YARA package\n' +
              'import com.shabari.yara.YaraPackage\n' +
              mainApplicationContent.slice(endOfImport + 1);
          }
          
          // Add package to the list if not present
          if (!mainApplicationContent.includes('YaraPackage()')) {
            if (isKotlin) {
              // Handle Kotlin syntax
              const getPackagesRegex = /override fun getPackages\(\): List<ReactPackage> \{[\s\S]*?return packages/;
              mainApplicationContent = mainApplicationContent.replace(
                getPackagesRegex,
                (match) => {
                  const returnIndex = match.lastIndexOf('return packages');
                  return match.slice(0, returnIndex) +
                    '            \n            // Add YARA package for native malware detection\n' +
                    '            packages.add(YaraPackage())\n            \n            ' + 
                    match.slice(returnIndex);
                }
              );
            } else {
              // Handle Java syntax
              const getPackagesRegex = /protected List<ReactPackage> getPackages\(\) {[\s\S]*?return packages;/;
              mainApplicationContent = mainApplicationContent.replace(
                getPackagesRegex,
                (match) => {
                  const returnIndex = match.lastIndexOf('return packages;');
                  return match.slice(0, returnIndex) +
                    '      packages.add(new YaraPackage());\n' +
                    '      ' + match.slice(returnIndex);
                }
              );
            }
          }
          
          fs.writeFileSync(mainApplicationPath, mainApplicationContent);
          console.log(`✅ YaraPackage added to ${isKotlin ? 'Kotlin' : 'Java'} MainApplication`);
        } else {
          console.warn('⚠️ MainApplication file not found (neither .java nor .kt)');
        }
        
        return config;
      });
    }
  ]);
}

module.exports = withYaraEngine;
