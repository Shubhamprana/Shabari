/**
 * SMS Consent Hook - MANUAL ONLY (Play Store Compliant)
 * 
 * This hook has been modified to remove all automatic SMS monitoring
 * to comply with Google Play Store policies.
 * 
 * REMOVED FEATURES (for Play Store compliance):
 * - Automatic SMS listening/monitoring
 * - Background SMS processing
 * - RECEIVE_SMS permission usage
 * 
 * AVAILABLE FEATURES:
 * - Manual SMS scanning only (user-initiated)
 * - Privacy-first approach
 * - No automatic monitoring
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export interface SmsConsentResult {
  message: string | null;
  senderId: string | null;
  success: boolean;
  error?: string;
}

export interface SmsConsentState {
  isListening: boolean;
  lastMessage: SmsConsentResult | null;
  error: string | null;
}

/**
 * Hook for Manual SMS Operations Only
 * 
 * PLAY STORE COMPLIANT VERSION:
 * - No automatic SMS monitoring
 * - No background SMS processing
 * - User must manually trigger SMS scanning
 * - Uses only READ_SMS permission for manual access
 */
export function useSmsConsent() {
  const [state, setState] = useState<SmsConsentState>({
    isListening: false,
    lastMessage: null,
    error: null,
  });

  /**
   * DISABLED: Automatic SMS listening removed for Play Store compliance
   */
  const startListening = useCallback(async (): Promise<boolean> => {
    const error = 'Automatic SMS monitoring disabled for Play Store compliance. Use manual SMS scanning instead.';
    console.log('[useSmsConsent] ' + error);
    setState(prev => ({ ...prev, error }));
    return false;
  }, []);

  /**
   * Stop listening - No-op since no automatic listening
   */
  const stopListening = useCallback(() => {
    console.log('[useSmsConsent] No automatic listening to stop');
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  /**
   * Clear the last received message
   */
  const clearLastMessage = useCallback(() => {
    setState(prev => ({ ...prev, lastMessage: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    clearLastMessage,
    isAndroid: Platform.OS === 'android',
    isAvailable: false, // Disabled for Play Store compliance
    isManualOnly: true, // Indicate this is manual-only mode
    complianceNote: 'Automatic SMS monitoring disabled for Play Store compliance'
  };
} 