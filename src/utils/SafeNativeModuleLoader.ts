/**
 * Safe Native Module Loader
 * Prevents app crashes when native modules fail to load
 * Provides graceful degradation for optional security features
 */

import { Platform } from 'react-native';

export interface SafeModuleResult<T> {
  isAvailable: boolean;
  module: T | null;
  error: string | null;
}

/**
 * Safely loads a native module with error handling
 */
export function safeLoadNativeModule<T>(
  moduleName: string,
  loader: () => T
): SafeModuleResult<T> {
  try {
    const module = loader();
    
    if (!module) {
      return {
        isAvailable: false,
        module: null,
        error: `Module ${moduleName} returned null/undefined`
      };
    }

    console.log(`✅ Native module '${moduleName}' loaded successfully`);
    return {
      isAvailable: true,
      module,
      error: null
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Native module '${moduleName}' failed to load:`, errorMessage);
    
    return {
      isAvailable: false,
      module: null,
      error: errorMessage
    };
  }
}

/**
 * Checks if a native module method exists and is callable
 */
export function isNativeMethodAvailable(
  module: any,
  methodName: string
): boolean {
  try {
    return module && typeof module[methodName] === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Safely calls a native module method with timeout protection
 */
export async function safeCallNativeMethod<T>(
  moduleName: string,
  method: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<{ success: boolean; data: T | null; error: string | null }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout calling ${moduleName}`)), timeoutMs)
    );

    const data = await Promise.race([method(), timeoutPromise]);

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Native method call failed for '${moduleName}':`, errorMessage);

    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
}

/**
 * Checks if app is running in a development/test environment
 */
export function isDevelopmentEnvironment(): boolean {
  return __DEV__ || Platform.OS === 'web';
}

/**
 * Creates a mock module for development/fallback
 */
export function createMockModule<T>(
  moduleName: string,
  mockMethods: Partial<T>
): T {
  console.log(`🎭 Creating mock module for '${moduleName}'`);
  
  return new Proxy({} as T, {
    get: (target, prop) => {
      if (prop in mockMethods) {
        return mockMethods[prop as keyof T];
      }
      
      // Return a no-op function for unmocked methods
      return (...args: any[]) => {
        console.log(`📝 Mock call to ${moduleName}.${String(prop)}`, args);
        return Promise.resolve({ success: false, message: 'Mock implementation' });
      };
    }
  });
}

/**
 * Platform-specific module loader with fallback
 */
export function loadPlatformModule<T>(
  moduleName: string,
  androidLoader: () => T,
  iosLoader?: () => T,
  webFallback?: T
): SafeModuleResult<T> {
  if (Platform.OS === 'android') {
    return safeLoadNativeModule(moduleName, androidLoader);
  } else if (Platform.OS === 'ios' && iosLoader) {
    return safeLoadNativeModule(moduleName, iosLoader);
  } else if (Platform.OS === 'web' && webFallback) {
    console.log(`ℹ️ Using web fallback for '${moduleName}'`);
    return {
      isAvailable: true,
      module: webFallback,
      error: null
    };
  }

  return {
    isAvailable: false,
    module: null,
    error: `Platform ${Platform.OS} not supported for ${moduleName}`
  };
}

/**
 * Validates that all required methods exist on a module
 */
export function validateModuleMethods(
  moduleName: string,
  module: any,
  requiredMethods: string[]
): { isValid: boolean; missingMethods: string[] } {
  const missingMethods = requiredMethods.filter(
    method => !isNativeMethodAvailable(module, method)
  );

  if (missingMethods.length > 0) {
    console.warn(
      `⚠️ Module '${moduleName}' is missing methods:`,
      missingMethods
    );
  }

  return {
    isValid: missingMethods.length === 0,
    missingMethods
  };
}

