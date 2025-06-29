import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Button, Card } from '../components';
import { ocrService } from '../services/OCRService';
import { OtpInsightAnalysisResult, otpInsightService } from '../services/OtpInsightService';
import { PhotoFraudDetectionService, PhotoFraudResult } from '../services/PhotoFraudDetectionService';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface MessageAnalysisScreenProps {
  navigation: any;
}

const MessageAnalysisScreen: React.FC<MessageAnalysisScreenProps> = ({ navigation }) => {
  const { isPremium } = useSubscriptionStore();
  const [messageInput, setMessageInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<OtpInsightAnalysisResult | null>(null);
  const [photoFraudResult, setPhotoFraudResult] = useState<PhotoFraudResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing message...');
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'text' | 'photo'>('text');

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      // Update service config based on user subscription
      otpInsightService.updateConfig({
        isPremiumUser: isPremium
      });

      await otpInsightService.initialize();
      setIsServiceInitialized(true);
    } catch (error) {
      console.error('Failed to initialize OTP Insight Service:', error);
      Alert.alert(
        'Service Error',
        'Failed to initialize fraud detection service. Some features may not work properly.'
      );
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      // For now, show a manual paste instruction
      Alert.alert(
        'Paste Message',
        'Please manually paste the message into the text field.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to read from clipboard');
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll permission is needed to select screenshots'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setAnalysisMode('photo');
        
        // Enhanced photo analysis with fraud detection
        setLoading(true);
        setLoadingMessage('🔍 Analyzing photo for fraud...');
        
        try {
          // Step 1: Perform comprehensive photo fraud analysis
          const fraudAnalysis = await PhotoFraudDetectionService.analyzePhoto(imageUri);
          setPhotoFraudResult(fraudAnalysis);
          
          // Step 2: If text was extracted, also fill the message field
          if (fraudAnalysis.extractedText) {
            setMessageInput(fraudAnalysis.extractedText);
          }
          
          setLoading(false);
          setLoadingMessage('');
          
          // Show comprehensive fraud analysis results
          const riskEmoji = fraudAnalysis.riskLevel === 'CRITICAL' ? '🚨' : 
                           fraudAnalysis.riskLevel === 'HIGH_RISK' ? '⚠️' : 
                           fraudAnalysis.riskLevel === 'SUSPICIOUS' ? '🟡' : '✅';
          
          const fraudStatus = fraudAnalysis.isFraudulent ? 'FRAUD DETECTED' : 'NO FRAUD DETECTED';
          
          Alert.alert(
            `${riskEmoji} Photo Analysis Complete`,
            `${fraudStatus}\n\nRisk Level: ${fraudAnalysis.riskLevel}\nConfidence: ${fraudAnalysis.confidence}%\n\n` +
            `Fraud Indicators: ${fraudAnalysis.fraudIndicators.length}\n` +
            `Text Extracted: ${fraudAnalysis.extractedText ? 'Yes' : 'No'}\n\n` +
            `${fraudAnalysis.isFraudulent ? '⚠️ This image contains fraudulent content!' : '✅ No fraud patterns detected'}`,
            [
              {
                text: 'View Details',
                onPress: () => showDetailedPhotoAnalysis(fraudAnalysis)
              },
              {
                text: fraudAnalysis.extractedText ? 'Analyze Text' : 'OK',
                onPress: fraudAnalysis.extractedText ? () => analyzeMessage() : undefined
              }
            ]
          );
          
        } catch (error) {
          setLoading(false);
          setLoadingMessage('');
          console.error('Photo fraud analysis error:', error);
          
          // Fallback to OCR only
          try {
            const ocrResult = await ocrService.extractTextFromImage(imageUri);
            if (ocrResult.success && ocrResult.text.trim()) {
              setMessageInput(ocrResult.text);
              Alert.alert(
                '📝 Text Extracted',
                'Fraud analysis failed, but text was extracted successfully. You can now analyze the text for fraud patterns.',
                [
                  { text: 'Analyze Text', onPress: () => analyzeMessage() },
                  { text: 'Review First' }
                ]
              );
            } else {
              Alert.alert(
                '❌ Analysis Failed',
                'Both fraud detection and text extraction failed. Please try a clearer image or type manually.',
                [
                  { text: 'Remove Image', style: 'destructive', onPress: () => setSelectedImage(null) },
                  { text: 'Type Manually' }
                ]
              );
            }
          } catch (ocrError) {
            Alert.alert('❌ Processing Failed', 'Unable to process this image. Please try another image or type manually.');
          }
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showDetailedPhotoAnalysis = (result: PhotoFraudResult) => {
    const detailsText = [
      `🎯 Risk Score: ${result.riskScore}/100`,
      `📊 Confidence: ${result.confidence}%`,
      `🔍 Detection Methods: ${result.detectionMethods.join(', ')}`,
      '',
      '🚨 Fraud Indicators:',
      ...result.fraudIndicators.map(indicator => `• ${indicator}`),
      '',
      '⚠️ Warnings:',
      ...result.warnings.map(warning => `• ${warning}`),
      '',
      '📝 Extracted Text:',
      result.extractedText || 'No text found'
    ].join('\n');

    Alert.alert(
      `📸 Detailed Photo Analysis`,
      detailsText,
      [
        { text: 'Share Results', onPress: () => console.log('Share photo analysis results') },
        { text: 'Close' }
      ]
    );
  };

  const analyzeMessage = async () => {
    if (!messageInput.trim()) {
      Alert.alert('Input Required', 'Please enter a message to analyze');
      return;
    }

    if (!isServiceInitialized) {
      Alert.alert('Service Error', 'Fraud detection service is not ready');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setLoadingMessage('Analyzing message...');

    try {
      // Update user interaction for context tracking
      otpInsightService.updateUserInteraction();

      // Analyze the message
      const result = await otpInsightService.analyzeMessage(messageInput, 'MANUAL_INPUT');
      setAnalysisResult(result);

    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Error',
        'Failed to analyze the message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setMessageInput('');
    setAnalysisResult(null);
    setSelectedImage(null);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE':
        return '#22c55e';
      case 'SUSPICIOUS':
        return '#f59e0b';
      case 'HIGH_RISK':
        return '#ef4444';
      case 'CRITICAL':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE':
        return 'shield-checkmark';
      case 'SUSPICIOUS':
        return 'warning';
      case 'HIGH_RISK':
        return 'alert';
      case 'CRITICAL':
        return 'skull';
      default:
        return 'help';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Analysis</Text>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.inputCard}>
        <Text style={styles.sectionTitle}>📱 Analyze Message</Text>
        <Text style={styles.sectionDescription}>
          Paste a suspicious SMS or message below to check for fraud patterns
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Paste message here..."
            multiline
            numberOfLines={5}
            value={messageInput}
            onChangeText={setMessageInput}
            textAlignVertical="top"
          />
          
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePasteFromClipboard}
            >
              <Ionicons name="clipboard" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Paste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleImagePicker}
            >
              <Ionicons name="image" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('LiveQRScanner')}
            >
              <Ionicons name="qr-code" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Live QR</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <View style={styles.imageStatus}>
                <Ionicons name="image" size={16} color="#007AFF" />
                <Text style={styles.imageStatusText}>
                  {loading ? 'Processing screenshot with OCR...' : 'Screenshot ready for OCR analysis'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Analyzing...' : 'Analyze Message'}
            onPress={analyzeMessage}
            disabled={loading || !messageInput.trim()}
            style={styles.analyzeButton}
          />
          
          {messageInput && (
            <Button
              title="Clear"
              onPress={clearAnalysis}
              variant="secondary"
              style={styles.clearButton}
            />
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        )}
      </Card>

      {analysisResult && (
        <Card style={styles.resultCard}>
          <View style={styles.riskHeader}>
            <Ionicons
              name={getRiskIcon(analysisResult.overallRiskLevel)}
              size={32}
              color={getRiskColor(analysisResult.overallRiskLevel)}
            />
            <View style={styles.riskInfo}>
              <Text style={[styles.riskLevel, { color: getRiskColor(analysisResult.overallRiskLevel) }]}>
                {analysisResult.overallRiskLevel}
              </Text>
              <Text style={styles.recommendedAction}>
                {analysisResult.recommendedAction}
              </Text>
            </View>
          </View>

          <View style={styles.analysisDetails}>
            <Text style={styles.detailsTitle}>Analysis Details</Text>
            
            {/* Sender Analysis */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sender Risk:</Text>
              <Text style={[
                styles.detailValue,
                { color: analysisResult.senderVerdict.riskLevel === 'SAFE' ? '#22c55e' : '#ef4444' }
              ]}>
                {analysisResult.senderVerdict.riskLevel}
              </Text>
            </View>

            {/* OTP Analysis */}
            {analysisResult.otpAnalysis.otpCode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>OTP Code:</Text>
                <Text style={styles.detailValue}>{analysisResult.otpAnalysis.otpCode}</Text>
              </View>
            )}

            {analysisResult.otpAnalysis.transactionType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Type:</Text>
                <Text style={styles.detailValue}>{analysisResult.otpAnalysis.transactionType}</Text>
              </View>
            )}

            {analysisResult.otpAnalysis.amount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>₹{analysisResult.otpAnalysis.amount}</Text>
              </View>
            )}

            {analysisResult.otpAnalysis.merchant && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Merchant:</Text>
                <Text style={styles.detailValue}>{analysisResult.otpAnalysis.merchant}</Text>
              </View>
            )}

            {/* ML Analysis (Premium Feature) */}
            {otpInsightService.isPremiumFeaturesAvailable() && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>AI Confidence:</Text>
                <Text style={styles.detailValue}>
                  {(analysisResult.mlVerdict.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            )}

            {/* Context Analysis */}
            {analysisResult.contextSuspicious && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Timing:</Text>
                <Text style={[styles.detailValue, { color: '#ef4444' }]}>Suspicious</Text>
              </View>
            )}

            <View style={styles.detailsText}>
              <Text style={styles.detailsDescription}>{analysisResult.details}</Text>
            </View>
          </View>

          {!isPremium && (
            <Card style={styles.premiumPrompt}>
              <View style={styles.premiumContent}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Upgrade for Advanced AI Analysis</Text>
                  <Text style={styles.premiumDescription}>
                    Get ML-powered fraud detection and enhanced accuracy
                  </Text>
                </View>
                <Button
                  title="Upgrade"
                  onPress={() => navigation.navigate('Subscription')}
                  style={styles.premiumButton}
                />
              </View>
            </Card>
          )}
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔒 Privacy First</Text>
        <Text style={styles.infoText}>
          All message analysis happens locally on your device. No message content is sent to external servers.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#16213e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  inputCard: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    backgroundColor: '#2a2a3e',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    flex: 0.4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  analyzeButton: {
    flex: 1,
  },
  clearButton: {
    minWidth: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 8,
  },
  resultCard: {
    margin: 20,
    marginTop: 20,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  riskInfo: {
    marginLeft: 16,
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recommendedAction: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  analysisDetails: {
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailLabel: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsText: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
  },
  detailsDescription: {
    color: '#a0a0a0',
    fontSize: 14,
    lineHeight: 20,
  },
  premiumPrompt: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  premiumDescription: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
  },
  premiumButton: {
    minWidth: 80,
  },
  infoCard: {
    margin: 20,
    backgroundColor: '#0f3460',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    color: '#a0a0a0',
    fontSize: 14,
    lineHeight: 20,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
  },
  imageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageStatusText: {
    color: '#a0a0a0',
    marginLeft: 8,
  },
  removeImageButton: {
    padding: 8,
  },
});

export default MessageAnalysisScreen; 