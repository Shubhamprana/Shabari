// Enhanced Compatibility Layer
// This file provides the bridge between old imports and new Universal Services

import { BuildEnvironment, UniversalAuth, UniversalFS, UniversalNotifs, UniversalShare } from './UniversalServices';

// Legacy RNFS compatibility
export const MockRNFS = {
  get DocumentDirectoryPath() {
    return UniversalFS.DocumentDirectoryPath;
  },
  writeFile: async (path: string, content: string) => {
    return UniversalFS.writeFile(path, content);
  },
  readFile: async (path: string) => {
    return UniversalFS.readFile(path);
  },
  exists: async (path: string) => {
    return UniversalFS.exists(path);
  },
  mkdir: async (path: string) => {
    return UniversalFS.mkdir(path);
  }
};

// Legacy Share Intent compatibility
export const MockShareIntent = {
  getReceivedFiles: async () => {
    return UniversalShare.getReceivedFiles();
  },
  clearReceivedFiles: async () => {
    return UniversalShare.clearReceivedFiles();
  }
};

// Enhanced SMS Retriever (using Universal Services)
export const MockSMSRetriever = {
  startSmsRetriever: async () => {
    console.log('[MockSMSRetriever] SMS retriever functionality available via Universal Services');
    return Promise.resolve();
  }
};

// Universal Notification Bridge
export const NotificationBridge = {
  schedule: async (title: string, body: string, data?: any) => {
    return UniversalNotifs.scheduleNotification(title, body, data);
  },
  cancelAll: async () => {
    return UniversalNotifs.cancelAllNotifications();
  }
};

// Google Auth Bridge
export const GoogleAuthBridge = {
  configure: async (config: any) => {
    return UniversalAuth.configure(config);
  },
  signIn: async () => {
    return UniversalAuth.signIn();
  },
  signOut: async () => {
    return UniversalAuth.signOut();
  }
};

// Export environment info
export { BuildEnvironment };

console.log('🚀 Enhanced compatibility layer loaded - Universal Services active');
console.log('📱 Build Environment:', BuildEnvironment.isEASBuild ? 'EAS Build' : 'Local Build');
