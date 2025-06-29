import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { manualSMSAnalyzer, SMSAnalysisInput, SMSAnalysisResult } from '../services/ManualSMSAnalyzer';

const { width } = Dimensions.get('window');

interface ManualSMSScannerScreenProps {
  onNavigateBack?: () => void;
}

export const ManualSMSScannerScreen: React.FC<ManualSMSScannerScreenProps> = ({
  onNavigateBack
}) => {
  const [senderInfo, setSenderInfo] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SMSAnalysisResult | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const handleAnalyzeSMS = async () => {
    if (!senderInfo.trim() || !messageContent.trim()) {
      Alert.alert(
        '⚠️ Missing Information',
        'Please provide both sender information and message content for accurate analysis.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const input: SMSAnalysisInput = {
        senderInfo: senderInfo.trim(),
        messageContent: messageContent.trim(),
        userLocation: userLocation.trim() || undefined,
        receivedTime: new Date()
      };

      console.log('🔍 Starting manual SMS analysis with input:', input);
      const result = await manualSMSAnalyzer.analyzeSMS(input);
      console.log('✅ Analysis completed:', result);
      
      setAnalysisResult(result);
      setShowDetailedAnalysis(false);

      // Show immediate alert for high-risk messages
      if (result.isFraud || result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
        Alert.alert(
          '🚨 FRAUD ALERT',
          `This message appears to be fraudulent (${result.riskLevel} risk).\n\nDo NOT respond or share personal information!`,
          [
            {
              text: 'View Details',
              onPress: () => setShowDetailedAnalysis(true)
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }

    } catch (error) {
      console.error('❌ SMS analysis failed:', error);
      Alert.alert(
        '❌ Analysis Failed',
        `Unable to analyze the SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearForm = () => {
    setSenderInfo('');
    setMessageContent('');
    setUserLocation('');
    setAnalysisResult(null);
    setShowDetailedAnalysis(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return '#FF0000';
      case 'HIGH': return '#FF4500';
      case 'MEDIUM': return '#FFA500';
      case 'LOW': return '#32CD32';
      default: return '#888';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '✅';
      default: return '❓';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual SMS Scanner</Text>
        <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📱 How to Use Manual SMS Scanner</Text>
          <Text style={styles.instructionsText}>
            1. <Text style={styles.bold}>Enter sender info</Text> (phone number or name){'\n'}
            2. <Text style={styles.bold}>Paste message content</Text> from the suspicious SMS{'\n'}
            3. <Text style={styles.bold}>Add your location</Text> (optional - helps with local fraud patterns){'\n'}
            4. <Text style={styles.bold}>Tap "Analyze SMS"</Text> for instant fraud detection
          </Text>
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 <Text style={styles.bold}>Privacy Protected:</Text> All analysis happens locally on your device. No data is sent to external servers.
            </Text>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📝 SMS Details</Text>
          
          {/* Sender Information */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👤 WHO sent this message?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter phone number or sender name (e.g., +91-9876543210 or SBIBANK)"
              placeholderTextColor="#888"
              value={senderInfo}
              onChangeText={setSenderInfo}
              multiline={false}
            />
            <Text style={styles.inputHint}>
              Examples: +91-9876543210, HDFCBANK, UIDAI, or any name shown as sender
            </Text>
          </View>

          {/* Message Content */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 WHAT does the message say?</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              placeholder="Paste the complete SMS message content here..."
              placeholderTextColor="#888"
              value={messageContent}
              onChangeText={setMessageContent}
              multiline={true}
              numberOfLines={4}
            />
            <Text style={styles.inputHint}>
              Copy and paste the entire message for most accurate analysis
            </Text>
          </View>

          {/* User Location (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📍 Your Location (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your city/state (e.g., Mumbai, Delhi)"
              placeholderTextColor="#888"
              value={userLocation}
              onChangeText={setUserLocation}
              multiline={false}
            />
            <Text style={styles.inputHint}>
              Helps detect region-specific fraud patterns
            </Text>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity 
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={handleAnalyzeSMS}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>🔍 Analyze SMS for Fraud</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>📊 Analysis Results</Text>
            
            {/* Overall Result */}
            <View style={[styles.overallResult, { backgroundColor: analysisResult.isFraud ? '#ffebee' : '#e8f5e8' }]}>
              <Text style={styles.resultIcon}>
                {getRiskIcon(analysisResult.riskLevel)}
              </Text>
              <View style={styles.resultContent}>
                <Text style={[styles.resultSummary, { color: getRiskColor(analysisResult.riskLevel) }]}>
                  {analysisResult.explanation.summary}
                </Text>
                <Text style={styles.resultDetails}>
                  Risk Level: <Text style={[styles.bold, { color: getRiskColor(analysisResult.riskLevel) }]}>
                    {analysisResult.riskLevel}
                  </Text> | Confidence: <Text style={styles.bold}>{analysisResult.confidenceScore}%</Text>
                </Text>
              </View>
            </View>

            {/* WHO Analysis - SUPPLEMENTARY */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>👤 WHO Analysis (Supplementary - Sender Verification)</Text>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Sender Type:</Text>
                <Text style={styles.analysisValue}>{analysisResult.senderAnalysis.senderType}</Text>
              </View>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Legitimacy:</Text>
                <Text style={[styles.analysisValue, { 
                  color: analysisResult.senderAnalysis.senderLegitimacy === 'fraudulent' ? '#FF4500' : 
                         analysisResult.senderAnalysis.senderLegitimacy === 'suspicious' ? '#FFA500' : '#32CD32' 
                }]}>
                  {analysisResult.senderAnalysis.senderLegitimacy}
                </Text>
              </View>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Reputation Score:</Text>
                <Text style={[styles.analysisValue, { 
                  color: analysisResult.senderAnalysis.senderReputation < 30 ? '#FF4500' : 
                         analysisResult.senderAnalysis.senderReputation < 60 ? '#FFA500' : '#32CD32' 
                }]}>
                  {analysisResult.senderAnalysis.senderReputation}/100
                </Text>
              </View>
              {analysisResult.senderAnalysis.senderRedFlags.length > 0 && (
                <View style={styles.redFlagsContainer}>
                  <Text style={styles.redFlagsTitle}>🚩 Sender Red Flags:</Text>
                  {analysisResult.senderAnalysis.senderRedFlags.map((flag, index) => (
                    <Text key={index} style={styles.redFlag}>• {flag}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* WHAT Analysis - SUPPLEMENTARY */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>📝 WHAT Analysis (Supplementary - Content Patterns)</Text>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Fraud Patterns Found:</Text>
                <Text style={[styles.analysisValue, { 
                  color: analysisResult.contentAnalysis.fraudPatterns.length > 0 ? '#FF4500' : '#32CD32' 
                }]}>
                  {analysisResult.contentAnalysis.fraudPatterns.length} patterns
                </Text>
              </View>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Urgency Level:</Text>
                <Text style={[styles.analysisValue, { 
                  color: analysisResult.contentAnalysis.urgencyLevel === 'extreme' || 
                         analysisResult.contentAnalysis.urgencyLevel === 'high' ? '#FF4500' : 
                         analysisResult.contentAnalysis.urgencyLevel === 'medium' ? '#FFA500' : '#32CD32' 
                }]}>
                  {analysisResult.contentAnalysis.urgencyLevel}
                </Text>
              </View>
              
              {analysisResult.contentAnalysis.fraudPatterns.length > 0 && (
                <View style={styles.fraudPatternsContainer}>
                  <Text style={styles.fraudPatternsTitle}>⚠️ Detected Fraud Patterns:</Text>
                  {analysisResult.contentAnalysis.fraudPatterns.map((pattern, index) => (
                    <Text key={index} style={styles.fraudPattern}>• {pattern}</Text>
                  ))}
                </View>
              )}

              {analysisResult.contentAnalysis.socialEngineeringTactics.length > 0 && (
                <View style={styles.tacticsContainer}>
                  <Text style={styles.tacticsTitle}>🎭 Social Engineering Tactics:</Text>
                  {analysisResult.contentAnalysis.socialEngineeringTactics.map((tactic, index) => (
                    <Text key={index} style={styles.tactic}>• {tactic}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* ML Analysis - PRIMARY */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>🤖 ML Analysis (PRIMARY - AI Detection)</Text>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>ML Enabled:</Text>
                <Text style={styles.analysisValue}>{analysisResult.mlAnalysis.isEnabled ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Model Status:</Text>
                <Text style={[styles.analysisValue, { 
                  color: analysisResult.mlAnalysis.isModelLoaded ? '#32CD32' : '#FF6B6B' 
                }]}>
                  {analysisResult.mlAnalysis.isModelLoaded ? 'Loaded' : 'Not Available'}
                </Text>
              </View>
              {analysisResult.mlAnalysis.mlVerdict && (
                <>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>ML Verdict:</Text>
                    <Text style={[styles.analysisValue, { 
                      color: analysisResult.mlAnalysis.mlVerdict.isFraud ? '#FF4500' : '#32CD32' 
                    }]}>
                      {analysisResult.mlAnalysis.mlVerdict.isFraud ? 'FRAUD DETECTED' : 'SAFE'}
                    </Text>
                  </View>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>ML Confidence:</Text>
                    <Text style={[styles.analysisValue, { 
                      color: analysisResult.mlAnalysis.mlScore > 70 ? '#FF4500' : 
                             analysisResult.mlAnalysis.mlScore > 40 ? '#FFA500' : '#32CD32' 
                    }]}>
                      {analysisResult.mlAnalysis.mlScore}%
                    </Text>
                  </View>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>ML Contribution:</Text>
                    <Text style={styles.analysisValue}>{analysisResult.mlAnalysis.mlContribution}%</Text>
                  </View>
                  {analysisResult.mlAnalysis.mlVerdict.details && (
                    <View style={styles.mlDetailsContainer}>
                      <Text style={styles.mlDetailsTitle}>🔍 ML Details:</Text>
                      <Text style={styles.mlDetails}>
                        {analysisResult.mlAnalysis.mlVerdict.details}
                      </Text>
                    </View>
                  )}
                </>
              )}
              {!analysisResult.mlAnalysis.mlVerdict && analysisResult.mlAnalysis.isEnabled && (
                <View style={styles.mlNotAvailable}>
                  <Text style={styles.mlNotAvailableText}>
                    ⚠️ ML analysis not available - model loading in progress
                  </Text>
                </View>
              )}
              {!analysisResult.mlAnalysis.isEnabled && (
                <View style={styles.mlNotAvailable}>
                  <Text style={styles.mlNotAvailableText}>
                    ❌ ML analysis disabled
                  </Text>
                </View>
              )}
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
              {analysisResult.explanation.recommendations.map((recommendation, index) => (
                <Text key={index} style={styles.recommendation}>
                  {recommendation}
                </Text>
              ))}
            </View>

            {/* Detailed Analysis Toggle */}
            <TouchableOpacity 
              style={styles.detailsToggle}
              onPress={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            >
              <Text style={styles.detailsToggleText}>
                {showDetailedAnalysis ? '📄 Hide' : '📋 Show'} Detailed Analysis
              </Text>
              <Ionicons 
                name={showDetailedAnalysis ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#007AFF" 
              />
            </TouchableOpacity>

            {showDetailedAnalysis && (
              <View style={styles.detailedAnalysis}>
                <Text style={styles.detailedTitle}>🔍 Detailed Technical Analysis</Text>
                <Text style={styles.detailedContent}>
                  {analysisResult.explanation.detailedAnalysis}
                </Text>
                
                {analysisResult.explanation.redFlags.length > 0 && (
                  <View style={styles.allRedFlags}>
                    <Text style={styles.allRedFlagsTitle}>🚩 All Red Flags Detected:</Text>
                    {analysisResult.explanation.redFlags.map((flag, index) => (
                      <Text key={index} style={styles.detailedRedFlag}>
                        {index + 1}. {flag}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Example SMS for Testing */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>💡 Try with Example SMS</Text>
          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => {
              setSenderInfo('SBI12345');
              setMessageContent('URGENT: Your SBI account has been blocked. Click link to reactivate immediately: http://sbi-verify.tk/reactivate. Valid for 2 hours only. Share OTP to verify.');
              setUserLocation('Mumbai');
            }}
          >
            <Text style={styles.exampleButtonText}>🚨 Load Fraud Example</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.exampleButton, styles.legitExample]}
            onPress={() => {
              setSenderInfo('SBIINB');
              setMessageContent('Dear Customer, your account ending 1234 has been credited with Rs.5000 on 15-Jan-2024. Balance: Rs.25000. For queries call 1800-11-2211.');
              setUserLocation('Delhi');
            }}
          >
            <Text style={styles.exampleButtonText}>✅ Load Legitimate Example</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#a8b2d1',
    lineHeight: 20,
    marginBottom: 15,
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  privacyNote: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
  },
  privacyText: {
    fontSize: 12,
    color: '#a8b2d1',
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    minHeight: 50,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    fontStyle: 'italic',
  },
  analyzeButton: {
    backgroundColor: '#FF4500',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  overallResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  resultContent: {
    flex: 1,
  },
  resultSummary: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
  },
  analysisSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#0f3460',
    borderRadius: 10,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#a8b2d1',
    flex: 1,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    flex: 1,
  },
  redFlagsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  redFlagsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  redFlag: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 2,
  },
  fraudPatternsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  fraudPatternsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 5,
  },
  fraudPattern: {
    fontSize: 12,
    color: '#f57c00',
    marginBottom: 2,
  },
  tacticsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
  },
  tacticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 5,
  },
  tactic: {
    fontSize: 12,
    color: '#7b1fa2',
    marginBottom: 2,
  },
  recommendationsSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  recommendation: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 8,
    lineHeight: 18,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 10,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginRight: 5,
  },
  detailedAnalysis: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailedContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  allRedFlags: {
    marginTop: 10,
  },
  allRedFlagsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  detailedRedFlag: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 4,
    lineHeight: 16,
  },
  exampleCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  exampleButton: {
    backgroundColor: '#FF4500',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  legitExample: {
    backgroundColor: '#32CD32',
  },
  exampleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mlDetailsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0f3460',
    borderRadius: 8,
  },
  mlDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  mlDetails: {
    fontSize: 11,
    color: '#a8b2d1',
    lineHeight: 14,
  },
  mlNotAvailable: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
  },
  mlNotAvailableText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default ManualSMSScannerScreen; 