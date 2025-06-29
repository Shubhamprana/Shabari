/**
 * Mock ML Kit Text Recognition for development environments
 * This prevents build errors when the native module is not available
 */

export interface MLKitTextBlock {
  text: string;
  boundingBox?: any;
  confidence?: number;
}

export interface MLKitResult {
  text: string;
  blocks?: MLKitTextBlock[];
}

export class MockMLKitTextRecognition {
  static async recognize(imageUri: string): Promise<MLKitResult> {
    console.log('[MockMLKit] Simulating text recognition for:', imageUri);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if this is a production build that should have real ML Kit
    const isProductionBuild = !process.env.EXPO_PUBLIC_APP_VARIANT?.includes('development');
    
    if (isProductionBuild) {
      // In production, suggest installation steps
      return {
        text: 'ML Kit Text Recognition not properly installed. Please install @react-native-ml-kit/text-recognition package and rebuild the app for OCR functionality.',
        blocks: [
          {
            text: 'Installation required for production OCR',
            confidence: 0.95,
            boundingBox: { x: 0, y: 0, width: 300, height: 40 }
          }
        ]
      };
    } else {
      // In development, provide mock result
      return {
        text: 'Mock OCR result - ML Kit not available in current environment',
        blocks: [
          {
            text: 'Mock text block for development',
            confidence: 0.85,
            boundingBox: { x: 0, y: 0, width: 100, height: 20 }
          }
        ]
      };
    }
  }
}

// Export as default for compatibility
export default MockMLKitTextRecognition; 