// Inject required Google Play Services dependencies for SMS Retriever / Credentials API
// This ensures classes like com.google.android.gms.auth.api.credentials.Credential
// are present during R8 minification on EAS builds.

const { withAppBuildGradle } = require('@expo/config-plugins');

function ensureDependencyLines(gradleContents) {
  const linesToAdd = [
    "    implementation 'com.google.android.gms:play-services-auth:20.7.0'",
    "    implementation 'com.google.android.gms:play-services-base:18.5.0'",
  ];

  if (!/dependencies\s*\{/.test(gradleContents)) {
    return gradleContents;
  }

  if (linesToAdd.every((l) => gradleContents.includes(l))) {
    return gradleContents;
  }

  return gradleContents.replace(/dependencies\s*\{/, (m) => `${m}\n${linesToAdd.join('\n')}\n`);
}

module.exports = function withGmsDependencies(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') {
      let contents = cfg.modResults.contents;
      contents = ensureDependencyLines(contents);
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
};


