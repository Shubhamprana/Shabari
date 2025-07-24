module.exports = {
  "name": "Shabari",
  "slug": "shabari",
  "version": "1.0.0",
  "platforms": [
    "android",
    "web"
  ],
  "orientation": "portrait",
  "icon": "./assets/images/icon.png",
  "userInterfaceStyle": "light",
  "splash": {
    "image": "./assets/images/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "package": "com.shabari.app",
    "versionCode": 61,
    "privacyPolicy": "https://shubham485.github.io/shabari-privacy-policy/",
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.READ_SMS",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  },
  "web": {
    "favicon": "./assets/images/favicon.png"
  },
  "scheme": "shabari",
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "mynbtxrbqbmhxvaimfhs.supabase.co"
        }
      ],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ],
  "plugins": [
    "expo-dev-client",
    "expo-notifications",
    [
      "expo-share-intent",
      {
        "iosActivationRules": {
          "NSExtensionActivationSupportsWebURLWithMaxCount": 1,
          "NSExtensionActivationSupportsWebPageWithMaxCount": 1,
          "NSExtensionActivationSupportsImageWithMaxCount": 1,
          "NSExtensionActivationSupportsFileWithMaxCount": 1
        },
        "androidIntentFilters": ["text/*", "image/*"],
        "androidMultiIntentFilters": ["image/*", "*/*"]
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "The app accesses your photos to scan suspicious images for fraud detection.",
        "cameraPermission": "The app accesses your camera to capture screenshots for fraud analysis."
      }
    ],
    [
      "expo-barcode-scanner",
      {
        "cameraPermission": "The app uses the camera to scan QR codes for fraud detection."
      }
    ],
    [
      "expo-build-properties",
      {
        "android": {
          "minSdkVersion": 24,
          "enableNativeMLKit": true,
          "compileSdkVersion": 35,
          "targetSdkVersion": 34,
          "buildToolsVersion": "34.0.0",
          "kotlinVersion": "1.9.25",
          "ndkVersion": "25.1.8937393",
          "enableProguardInReleaseBuilds": false,
          "enableHermes": true,
          "newArchEnabled": false,
          "manifestPlaceholders": {
            "shareIntentFilterLabel": "Scan with Shabari"
          }
        }
      }
    ],
    "./react-native-yara-engine/app.plugin.js"
  ],

  "owner": "shubham485",
  "newArchEnabled": false,
  "extra": {
    "eas": {
      "projectId": "3324cd17-9f20-4d91-8a33-8ed81dbac5d7"
    }
  }
}; 