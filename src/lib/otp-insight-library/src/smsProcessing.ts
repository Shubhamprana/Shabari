export interface ProcessedSMS {
  messageText: string;
  timestamp: number;
}

/**
 * Processes an SMS message, simulating user consent by accepting a raw message string.
 * In a real React Native Expo app, this function would be called after obtaining
 * the SMS text via react-native-sms-retriever or manual user input.
 *
 * @param rawMessage The raw text content of the SMS message.
 * @returns A ProcessedSMS object containing the message text and a timestamp.
 */
export function processSmsForConsent(rawMessage: string): ProcessedSMS {
  // In a real application, this is where you'd integrate with react-native-sms-retriever
  // and handle the user consent flow. For this library, we assume the message
  // has already been obtained with user consent.
  
  if (!rawMessage || rawMessage.trim() === '') {
    throw new Error('Message text cannot be empty.');
  }

  return {
    messageText: rawMessage.trim(),
    timestamp: Date.now(),
  };
}


