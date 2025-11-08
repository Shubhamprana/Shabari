const { withAndroidManifest, withSettingsGradle, withAppBuildGradle } = require('@expo/config-plugins');
const path = require('path');

const withAppPermissionScanner = (config) => {
  // 1) Ensure Android permissions and queries
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    const permissions = [
      'android.permission.QUERY_ALL_PACKAGES',
      'android.permission.PACKAGE_USAGE_STATS'
    ];

    permissions.forEach((permission) => {
      if (!androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'] = [];
      }
      const hasPermission = androidManifest.manifest['uses-permission'].some(
        (perm) => perm.$['android:name'] === permission
      );
      if (!hasPermission) {
        androidManifest.manifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    });

    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    return config;
  });

  // 2) Inject project into settings.gradle
  config = withSettingsGradle(config, (gradleConfig) => {
    const tag = "react-native-app-permission-scanner";
    const includeLine = `include ':${tag}'`;
    const projectLine = `project(':${tag}').projectDir = new File(rootProject.projectDir, '../react-native-app-permission-scanner/android')`;

    if (!gradleConfig.modResults.contents.includes(includeLine)) {
      gradleConfig.modResults.contents += `\n${includeLine}\n${projectLine}\n`;
    }
    return gradleConfig;
  });

  // 3) Add implementation project dependency into app/build.gradle
  config = withAppBuildGradle(config, (gradleConfig) => {
    const depLine = "implementation project(':react-native-app-permission-scanner')";
    if (!gradleConfig.modResults.contents.includes(depLine)) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        /dependencies \{/,
        `dependencies {\n    ${depLine}`
      );
    }
    return gradleConfig;
  });

  return config;
};

module.exports = withAppPermissionScanner;
