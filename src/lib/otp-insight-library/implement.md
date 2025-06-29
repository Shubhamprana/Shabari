Here's a step-by-step approach:
Step 1: Unzip and Place the Library
First, you need to get the library files into your Expo project.
Unzip the provided file: Unzip otp-insight-library-with-ml.zip that I previously sent you.
Copy to your project: Create a new folder inside your React Native Expo project, for example, your-expo-app/src/lib/otp-insight-library/. Copy the entire unzipped otp-insight-library folder (which contains src, assets, dist, package.json, tsconfig.json, etc.) into this new directory.
Your project structure should look something like this:
your-expo-app/
├── node_modules/
├── src/
│   ├── App.tsx
│   └── lib/
│       └── otp-insight-library/
│           ├── assets/
│           │   ├── fraud_detection_model.onnx
│           │   ├── trusted_dlt_headers.json
│           │   ├── vectorizer_data.json
│           │   └── vocabulary.json
│           ├── dist/ (compiled JavaScript files)
│           ├── src/ (TypeScript source files)
│           ├── package.json
│           ├── tsconfig.json
│           └── README.md
├── package.json
├── tsconfig.json
└── ... (other Expo project files)

Step 2: Install Dependencies
Navigate to your main Expo project directory (e.g., your-expo-app/) in your terminal and install the necessary packages.
bash
# Navigate to your main Expo project directory
cd your-expo-app

# Install onnxruntime-web (for the ML model inference)
pnpm add onnxruntime-web

# Install conceptual storage dependencies (if you plan to use them)
pnpm add @react-native-async-storage/async-storage expo-sqlite

# Install image picker for screenshot analysis (if you plan to use it)
pnpm add expo-image-picker

# For notifications (if you plan to use them)
pnpm add expo-notifications

# For SMS auto-detection (requires native module setup, see Step 5)
pnpm add react-native-sms-retriever
Step 3: Configure tsconfig.json (for TypeScript Expo Projects)
If your Expo project uses TypeScript, you need to ensure that your main tsconfig.json (in your-expo-app/) is configured to include the new library's files and allow asset imports.
Open your-expo-app/tsconfig.json and make sure it includes something similar to this:
json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "allowSyntheticDefaultImports": true, // Important for require() calls
    "esModuleInterop": true, // Important for require() calls
    "resolveJsonModule": true // Important for importing .json files directly
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "src/lib/otp-insight-library/src/**/*.ts", // Include the library's source files
    "src/lib/otp-insight-library/assets/**/*.json" // Include JSON assets
  ]
}
Step 4: Integrate the ML Model and Services (in your App.tsx or a dedicated service file)
This is where you bring the core logic into your application. You'll typically initialize the services once and then use them throughout your app.
typescript
// your-expo-app/src/App.tsx (or a new file like src/services/FraudDetectionService.ts)

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator, ScrollView } from 'react-native';

// Import services from your new library path
import { MLIntegrationService, ModelVerdict } from './lib/otp-insight-library/src/mlIntegration';
import { SenderVerificationService, SenderVerificationResult } from './lib/otp-insight-library/src/senderVerification';
import { OTPInsightService, OTPAnalysis } from './lib/otp-insight-library/src/otpInsightService';
import { processSmsForConsent } from './lib/otp-insight-library/src/smsProcessing';
import { UserContextTracker, OtpFrequencyTracker } from './lib/otp-insight-library/src/contextRules';
// import { NotificationBuilder } from './lib/otp-insight-library/src/notificationBuilder'; // Conceptual, implement with expo-notifications
// import { LocalStorageService } from './lib/otp-insight-library/src/localStorage'; // Conceptual, implement with AsyncStorage/expo-sqlite

// Initialize services globally or within a context/hook
const mlService = new MLIntegrationService();
const senderService = new SenderVerificationService();
const otpService = new OTPInsightService();
const userContextTracker = new UserContextTracker();
const otpFrequencyTracker = new OtpFrequencyTracker();
// const notificationBuilder = new NotificationBuilder();
// const localStorageService = new LocalStorageService();

export default function App() {
  const [isMlModelLoaded, setIsMlModelLoaded] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load the ML model when the app starts
    const loadMlModel = async () => {
      try {
        console.log('App: Loading ML model...');
        await mlService.loadModel();
        setIsMlModelLoaded(true);
        console.log('App: ML model loaded successfully.');
      } catch (error) {
        console.error('App: Failed to load ML model:', error);
        setAnalysisResult(`Failed to load ML model: ${error.message}`);
      }
    };

    loadMlModel();

    // You would also initialize LocalStorageService here if using it
    // localStorageService.initializePersistentStorage();

    // For automatic SMS detection, you'd set up listeners here
    // This part requires native module setup (see Step 5)

  }, []);

  const handleAnalyzeMessage = async () => {
    if (!messageInput.trim()) {
      setAnalysisResult('Please enter a message to analyze.');
      return;
    }
    if (!isMlModelLoaded) {
      setAnalysisResult('ML model is still loading. Please wait.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      // 1. Process the message (for manual input, this just formats it)
      const processedSms = processSmsForConsent(messageInput);

      // 2. Perform Sender Verification
      // For non-SMS, senderId might be 'UNKNOWN_APP' or inferred
      const senderId = 'UNKNOWN_APP'; // Or extract from message if possible
      const senderVerdict: SenderVerificationResult = senderService.verifySender(senderId, processedSms.messageText);

      // 3. Perform OTP Insight Analysis
      const otpAnalysis: OTPAnalysis = otpService.analyzeOTP(processedSms.messageText);

      // 4. Perform ML Prediction
      const mlVerdict: ModelVerdict = await mlService.predictWithModel(processedSms.messageText);

      // 5. Apply Context & Frequency Rules (conceptual, requires app-level integration)
      // userContextTracker.updateLastInteraction(); // Call this on user interaction
      // otpFrequencyTracker.recordOtpEvent(); // Call this when an OTP is received
      // const isContextSuspicious = userContextTracker.isContextSuspicious(processedSms.timestamp);
      // const isFrequencySuspicious = otpFrequencyTracker.isPossibleAttack();

      let resultText = `Analysis for: "${processedSms.messageText}"\n\n`;
      resultText += `Sender Risk: ${senderVerdict.riskLevel} (Details: ${JSON.stringify(senderVerdict.details)})\n`;
      resultText += `OTP Analysis: OTP=${otpAnalysis.otpCode || 'N/A'}, Type=${otpAnalysis.transactionType || 'N/A'}, Amount=${otpAnalysis.amount || 'N/A'}, Merchant=${otpAnalysis.merchant || 'N/A'}\n`;
      resultText += `ML Verdict: Is Fraud=${mlVerdict.isFraud}, Confidence=${mlVerdict.confidence.toFixed(4)} (Details: ${mlVerdict.details})\n`;
      // resultText += `Context Suspicious: ${isContextSuspicious}\n`;
      // resultText += `Frequency Suspicious: ${isFrequencySuspicious}\n`;

      // 6. Trigger Notifications (conceptual, requires expo-notifications setup)
      // if (mlVerdict.isFraud || senderVerdict.riskLevel === 'HIGH_RISK_FORGERY') {
      //   notificationBuilder.sendWarningNotification(processedSms.messageText);
      // } else if (otpAnalysis.transactionType === 'PAYMENT_OUT' && otpAnalysis.amount) {
      //   notificationBuilder.sendPaymentAlert(otpAnalysis.amount, processedSms.messageText);
      // } else {
      //   notificationBuilder.sendStandardNotification(processedSms.messageText);
      // }

      setAnalysisResult(resultText);

    } catch (error: any) {
      console.error('Error during analysis:', error);
      setAnalysisResult(`Error during analysis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>OTP Insight Analyzer</Text>

      {!isMlModelLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading ML Model...</Text>
        </View>
      )}

      {isMlModelLoaded && (
        <View>
          <Text style={styles.subtitle}>Manual Message Input</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste message here..."
            multiline
            numberOfLines={5}
            value={messageInput}
            onChangeText={setMessageInput}
          />
          <Button title={loading ? "Analyzing..." : "Analyze Message"} onPress={handleAnalyzeMessage} disabled={loading} />

          {analysisResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Analysis Result:</Text>
              <Text style={styles.resultText}>{analysisResult}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
Step 5: Implement Automatic SMS Detection (Requires Native Module Setup)
For fully automatic SMS detection, you will need to use a React Native library that can access SMS messages. react-native-sms-retriever is a common choice for Android, but it requires native module linking and specific permissions. iOS has stricter limitations on SMS access.
Android (Conceptual using react-native-sms-retriever):
Follow react-native-sms-retriever setup: Carefully follow the installation and linking instructions in the react-native-sms-retriever documentation. This typically involves modifying android/app/src/main/AndroidManifest.xml for permissions and potentially MainActivity.java.
Request Permissions: In your React Native code, request READ_SMS and RECEIVE_SMS permissions from the user.
Listen for SMS: Use the library to listen for incoming SMS messages.
typescript
// Example of how you might listen for SMS (conceptual)
import SmsRetriever from 'react-native-sms-retriever';
import { PermissionsAndroid } from 'react-native';

const requestSmsPermissions = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      { title: 'SMS Permission', message: 'App needs access to read SMS for fraud detection' }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('SMS permission granted');
      // Start SMS listener
      SmsRetriever.addSmsListener(event => {
        console.log('SMS received:', event.message);
        // Pass the message to your processing pipeline
        // handleAnalyzeMessage(event.message); // You'd need to adapt handleAnalyzeMessage to take a message directly
      });
    } else {
      console.log('SMS permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};

useEffect(() => {
  requestSmsPermissions();
  return () => {
    SmsRetriever.removeSmsListener();
  };
}, []);
iOS:
Direct programmatic access to SMS content is generally not allowed on iOS for privacy reasons. You would primarily rely on the manual copy-paste method for iOS users.
Step 6: Implement Screenshot Analysis (OCR) - Conceptual
For screenshot analysis, you'll need expo-image-picker and an OCR solution.
Install expo-image-picker: pnpm add expo-image-picker
Choose an OCR library:
On-device (e.g., react-native-tesseract-ocr): This keeps processing local but can be complex to set up and bundle. You'd need to research its compatibility with Expo and React Native versions.
Cloud-based (e.g., Google Cloud Vision API, AWS Textract): More accurate but requires internet access, API keys, and sends data off-device (which contradicts the privacy-first approach unless explicitly consented).
Integrate:
typescript
// your-expo-app/src/components/ScreenshotAnalyzer.tsx (Conceptual)
import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import TesseractOcr from 'react-native-tesseract-ocr'; // If using on-device OCR

// Import your analysis services
import { processSmsForConsent } from '../lib/otp-insight-library/src/smsProcessing';
import { SenderVerificationService } from '../lib/otp-insight-library/src/senderVerification';
import { OTPInsightService } from '../lib/otp-insight-library/src/otpInsightService';
import { MLIntegrationService } from '../lib/otp-insight-library/src/mlIntegration';

const mlService = new MLIntegrationService(); // Re-use or pass down initialized service
const senderService = new SenderVerificationService();
const otpService = new OTPInsightService();

const ScreenshotAnalyzer: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText(null);
      setAnalysisResult(null);
    }
  };

  const performOcrAndAnalyze = async () => {
    if (!imageUri) {
      setAnalysisResult('Please select an image first.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setExtractedText(null);

    try {
      // --- OCR Step (Conceptual) ---
      let ocrText = '';
      // if (TesseractOcr) {
      //   ocrText = await TesseractOcr.recognize(imageUri, 'eng', {});
      // } else {
      //   // Fallback or mock for demonstration
      //   ocrText = "Mock OCR: Your OTP is 123456. Click here: http://scam.link";
      // }
      ocrText = "Mock OCR: Your OTP is 123456. Click here: http://scam.link"; // Placeholder
      setExtractedText(ocrText );

      // --- Analysis Step (using your library) ---
      const processedSms = processSmsForConsent(ocrText);
      const senderVerdict = senderService.verifySender('OCR_SOURCE', processedSms.messageText);
      const otpAnalysis = otpService.analyzeOTP(processedSms.messageText);
      const mlVerdict = await mlService.predictWithModel(processedSms.messageText);

      let resultText = `Extracted Text:\n"${ocrText}"\n\n`;
      resultText += `Sender Risk: ${senderVerdict.riskLevel} (Details: ${JSON.stringify(senderVerdict.details)})\n`;
      resultText += `OTP Analysis: OTP=${otpAnalysis.otpCode || 'N/A'}, Type=${otpAnalysis.transactionType || 'N/A'}, Amount=${otpAnalysis.amount || 'N/A'}, Merchant=${otpAnalysis.merchant || 'N/A'}\n`;
      resultText += `ML Verdict: Is Fraud=${mlVerdict.isFraud}, Confidence=${mlVerdict.confidence.toFixed(4)} (Details: ${mlVerdict.details})\n`;

      setAnalysisResult(resultText);

    } catch (error: any) {
      setAnalysisResult(`Error during OCR or analysis: ${error.message}`);
      console.error('OCR/Analysis Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Screenshot</Text>
      <Button title="Pick a screenshot from gallery" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button
        title={loading ? "Analyzing..." : "Perform OCR & Analyze"}
        onPress={performOcrAndAnalyze}
        disabled={!imageUri || loading}
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />}
      {extractedText && <Text style={styles.extractedText}>Extracted Text: {extractedText}</Text>}
      {analysisResult && <Text style={styles.result}>{analysisResult}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  extractedText: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e0ffe0',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  result: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  spinner: {
    marginTop: 20,
  }
});

export default ScreenshotAnalyzer;
Step 7: Permissions and Privacy
Android Permissions: Ensure you request necessary permissions in your AndroidManifest.xml and at runtime in your app (e.g., READ_SMS, RECEIVE_SMS, READ_EXTERNAL_STORAGE, CAMERA).
iOS Permissions: For expo-image-picker, you'll need to configure Info.plist entries for photo library access.
User Consent: Always obtain explicit user consent before accessing sensitive data like SMS messages or photos.
Privacy Policy: Clearly communicate your app's privacy policy, emphasizing that all fraud detection analysis happens on-device and no message content is sent to external servers.
Step 8: Testing
Thoroughly test the integration on both Android and iOS devices/emulators.
Test with various types of messages: legitimate, OTP, payment confirmations, and different types of fraudulent messages.
Verify that the ML model loads correctly and provides accurate predictions.
This detailed guide should provide you with all the necessary steps to integrate the OTP Insight Library into your React Native Expo application. Remember to consult the README.md file within the otp-insight-library for more specific details on each module's usage and conceptual implementations.