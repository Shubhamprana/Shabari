import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Import SMS Retriever (already installed)
let SmsRetriever: any = null;
try {
  SmsRetriever = require('react-native-sms-retriever');
} catch (error) {
  console.log('[useSmsConsent] SMS Retriever not available:', error);
}

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
 * Hook for SMS User Consent API integration
 * Uses Google SMS User Consent API (Android) with react-native-sms-retriever
 * 
 * Features:
 * - Listens for OTP-like SMS messages
 * - Triggers OS consent prompt per message
 * - Only returns message text if user taps "Allow"
 * - Privacy-first: No broad READ_SMS permission needed
 */
export function useSmsConsent() {
  const [state, setState] = useState<SmsConsentState>({
    isListening: false,
    lastMessage: null,
    error: null,
  });

  const [listeners, setListeners] = useState<any[]>([]);

  /**
   * Start listening for SMS messages (Android only)
   */
  const startListening = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      const error = 'SMS consent is only available on Android';
      setState(prev => ({ ...prev, error }));
      return false;
    }

    if (!SmsRetriever) {
      const error = 'SMS Retriever module not available. Please ensure react-native-sms-retriever is properly installed.';
      setState(prev => ({ ...prev, error }));
      return false;
    }

    try {
      // Clear any previous state
      setState(prev => ({ ...prev, error: null, isListening: true }));

      // Start SMS User Consent API
      const registered = await SmsRetriever.requestPhoneNumber();
      
      if (registered) {
        console.log('[useSmsConsent] SMS Retriever registered successfully');
        
        // Listen for SMS events
        const phoneNumberListener = SmsRetriever.addSmsListener((event: any) => {
          console.log('[useSmsConsent] SMS event received:', event);
          
          if (event && event.message) {
            // Check if this looks like an OTP message
            if (isOtpLikeMessage(event.message)) {
              console.log('[useSmsConsent] OTP-like message detected, requesting consent');
              
              // Extract sender ID if available
              const senderId = extractSenderId(event);
              
              const result: SmsConsentResult = {
                message: event.message,
                senderId: senderId,
                success: true,
              };
              
              setState(prev => ({ 
                ...prev, 
                lastMessage: result,
                error: null 
              }));
            }
          } else {
            console.log('[useSmsConsent] No message in SMS event');
          }
        });

        // Store listener for cleanup
        setListeners(prev => [...prev, phoneNumberListener]);
        
        return true;
      } else {
        const error = 'Failed to register SMS Retriever';
        setState(prev => ({ ...prev, error, isListening: false }));
        return false;
      }
    } catch (error: any) {
      console.error('[useSmsConsent] Error starting SMS listener:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to start SMS listening',
        isListening: false 
      }));
      return false;
    }
  }, []);

  /**
   * Stop listening for SMS messages
   */
  const stopListening = useCallback(() => {
    console.log('[useSmsConsent] Stopping SMS listener');
    
    // Remove all listeners
    listeners.forEach(listener => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
    setListeners([]);
    
    setState(prev => ({ ...prev, isListening: false }));
  }, [listeners]);

  /**
   * Clear the last received message
   */
  const clearLastMessage = useCallback(() => {
    setState(prev => ({ ...prev, lastMessage: null }));
  }, []);

  /**
   * Check if message appears to be OTP-related
   */
  const isOtpLikeMessage = (message: string): boolean => {
    const otpKeywords = ['otp', 'verification', 'code', 'pin', 'password', 'verify'];
    const hasOtpKeyword = otpKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    // Check for 4-8 digit numbers (common OTP lengths)
    const hasDigitCode = /\b\d{4,8}\b/.test(message);
    
    // Check for banking/service keywords
    const serviceKeywords = ['bank', 'payment', 'transaction', 'login', 'signin', 'account'];
    const hasServiceKeyword = serviceKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    return hasOtpKeyword || (hasDigitCode && hasServiceKeyword);
  };

  /**
   * Extract sender ID from SMS event
   */
  const extractSenderId = (event: any): string | null => {
    // Try different possible fields for sender ID
    return event.originatingAddress || 
           event.sender || 
           event.phoneNumber || 
           event.from || 
           null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    clearLastMessage,
    isAndroid: Platform.OS === 'android',
    isAvailable: !!SmsRetriever && Platform.OS === 'android',
  };
} 