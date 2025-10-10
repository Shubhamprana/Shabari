const { withAndroidManifest, withGradleProperties, withAppBuildGradle, withMainApplication } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withShabariVpnProtection = (config, props = {}) => {
  // Add Android permissions for comprehensive protection
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Initialize permissions array if not present
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    const permissions = androidManifest.manifest['uses-permission'];
    
    // Required permissions for Shabari Protection Engine
    const requiredPermissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.READ_CALL_LOG',
      'android.permission.CALL_PHONE',
      'android.permission.ANSWER_PHONE_CALLS',
      'android.permission.BIND_VPN_SERVICE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
      'android.permission.VIBRATE'
    ];
    
    // Add each permission if not already present
    requiredPermissions.forEach(permissionName => {
      const existingPermission = permissions.find(
        (permission) => permission.$['android:name'] === permissionName
      );
      
      if (!existingPermission) {
        permissions.push({
          $: {
            'android:name': permissionName,
          },
        });
      }
    });
    
    // Add service declarations
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }
    
    const application = androidManifest.manifest.application[0];
    
    if (!application.service) {
      application.service = [];
    }
    
    // Add VPN Service
    const vpnService = application.service.find(
      (service) => service.$['android:name'] === '.ShabariVpnService'
    );
    
    if (!vpnService) {
      application.service.push({
        $: {
          'android:name': '.ShabariVpnService',
          'android:permission': 'android.permission.BIND_VPN_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.net.VpnService',
            },
          }],
        }],
      });
    }
    
    // Add Call Screening Service
    const callScreeningService = application.service.find(
      (service) => service.$['android:name'] === '.ShabariCallScreeningService'
    );
    
    if (!callScreeningService) {
      application.service.push({
        $: {
          'android:name': '.ShabariCallScreeningService',
          'android:permission': 'android.permission.BIND_SCREENING_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.telecom.CallScreeningService',
            },
          }],
        }],
      });
    }
    
    return config;
  });
  
  // Configure Gradle properties
  config = withGradleProperties(config, (config) => {
    const gradleProperties = config.modResults;
    
    // Ensure AndroidX is enabled
    if (!gradleProperties.find((item) => item.key === 'android.useAndroidX')) {
      gradleProperties.push({
        type: 'property',
        key: 'android.useAndroidX',
        value: 'true',
      });
    }
    
    // Ensure Jetifier is enabled
    if (!gradleProperties.find((item) => item.key === 'android.enableJetifier')) {
      gradleProperties.push({
        type: 'property',
        key: 'android.enableJetifier',
        value: 'true',
      });
    }
    
    return config;
  });
  
  // Configure app build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Add Kotlin support if not already present
    if (!buildGradle.includes("apply plugin: 'kotlin-android'")) {
      config.modResults.contents = buildGradle.replace(
        "apply plugin: 'com.android.application'",
        "apply plugin: 'com.android.application'\napply plugin: 'kotlin-android'"
      );
    }
    
    // Add dependencies if not already present
    const dependencies = [
      "implementation 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'",
      "implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'",
      "implementation 'com.squareup.okhttp3:okhttp:4.11.0'",
      "implementation 'com.squareup.okio:okio:3.5.0'"
    ];
    
    dependencies.forEach((dependency) => {
      if (!config.modResults.contents.includes(dependency)) {
        config.modResults.contents = config.modResults.contents.replace(
          /dependencies\s*{/,
          `dependencies {\n    ${dependency}`
        );
      }
    });
    
    return config;
  });
  
  // Add ReactNativeProxyEnginePackage to MainApplication
  config = withMainApplication(config, async (config) => {
    try {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');
      
      const mainApplicationJavaPath = path.join(
        androidRoot,
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
        androidRoot,
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
        if (!mainApplicationContent.includes('import com.reactnativeproxyengine.ReactNativeProxyEnginePackage')) {
          const importIndex = mainApplicationContent.lastIndexOf('import');
          const endOfImport = mainApplicationContent.indexOf('\n', importIndex);
          mainApplicationContent = 
            mainApplicationContent.slice(0, endOfImport + 1) +
            '\n// Import Proxy Engine package\n' +
            'import com.reactnativeproxyengine.ReactNativeProxyEnginePackage\n' +
            mainApplicationContent.slice(endOfImport + 1);
        }
        
        // Add package to the list if not present
        if (!mainApplicationContent.includes('ReactNativeProxyEnginePackage()')) {
          if (isKotlin) {
            // Handle Kotlin syntax - add after PackageList(this).packages
            const packageListRegex = /val packages = PackageList\(this\)\.packages/;
            mainApplicationContent = mainApplicationContent.replace(
              packageListRegex,
              (match) => {
                return match + '\n            // Add Proxy Engine package for VPN protection\n            packages.add(ReactNativeProxyEnginePackage())';
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
                  '      packages.add(new ReactNativeProxyEnginePackage());\n' +
                  '      ' + match.slice(returnIndex);
              }
            );
          }
        }
        
        fs.writeFileSync(mainApplicationPath, mainApplicationContent);
        console.log(`✅ ReactNativeProxyEnginePackage added to ${isKotlin ? 'Kotlin' : 'Java'} MainApplication`);
      } else {
        console.warn('⚠️ MainApplication file not found (neither .java nor .kt)');
      }
      
      return config;
    } catch (error) {
      console.warn('⚠️ Proxy Engine: Error configuring MainApplication:', error.message);
      return config;
    }
  });
  
  return config;
};

module.exports = withShabariVpnProtection;

