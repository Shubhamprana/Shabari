/**
 * SMS Scanner Screen
 * Manual SMS selection and fraud detection interface
 * User-controlled SMS analysis without automatic monitoring
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Button, Card } from '../components';
import { SMSAnalysisResult, SMSFilter, SMSMessage, smsReaderService } from '../services/SMSReaderService';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface SMSScannerScreenProps {
  navigation: any;
}

const SMSScannerScreen: React.FC<SMSScannerScreenProps> = ({ navigation }) => {
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'suspicious'>('all');
  const [analysisResults, setAnalysisResults] = useState<Map<string, SMSAnalysisResult>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);
  
  const { isPremium } = useSubscriptionStore();

  useEffect(() => {
    initializeSMSService();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [smsMessages, searchQuery, selectedFilter]);

  const initializeSMSService = async () => {
    try {
      setIsLoading(true);
      console.log('📱 Initializing SMS Scanner...');
      
      const initialized = await smsReaderService.initialize();
      setServiceReady(initialized);
      
      if (initialized) {
        console.log('✅ SMS service initialized successfully');
        await loadSMSMessages();
      } else {
        console.log('❌ SMS service initialization failed');
        // The SMSReaderService will handle showing appropriate permission dialogs
        // No need to show additional alerts here
      }
    } catch (error) {
      console.error('❌ Failed to initialize SMS service:', error);
      Alert.alert(
        '❌ SMS Scanner Error', 
        'Unable to initialize SMS scanner. Please ensure you have granted SMS permissions in your device settings.\n\nTo fix this:\n1. Go to Settings → Apps → Shabari\n2. Tap Permissions\n3. Enable SMS permission\n4. Return to Shabari and try again',
        [
          { text: 'OK' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              try {
                // Open app settings
                import('react-native').then(({ Linking }) => {
                  Linking.openSettings();
                });
              } catch (err) {
                console.error('Failed to open settings:', err);
              }
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSMSMessages = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Loading SMS messages...');
      
      const filter: SMSFilter = {
        messageType: 'inbox',
        limit: 50 // Load recent 50 messages
      };
      
      const messages = await smsReaderService.getSMSMessages(filter);
      setSmsMessages(messages);
      
      console.log(`📊 Loaded ${messages.length} SMS messages`);
    } catch (error) {
      console.error('❌ Error loading SMS messages:', error);
      Alert.alert('Error', 'Failed to load SMS messages. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = smsMessages;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(msg =>
        msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(msg => msg.read === 0);
        break;
      case 'suspicious':
        // Show messages that might be suspicious based on content
        filtered = filtered.filter(msg => {
          const body = msg.body.toLowerCase();
          return (
            body.includes('urgent') ||
            body.includes('verify') ||
            body.includes('click') ||
            body.includes('expire') ||
            body.includes('suspend') ||
            body.includes('lottery') ||
            body.includes('prize') ||
            body.includes('congratulations')
          );
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredMessages(filtered);
  };

  const analyzeSMSMessage = async (message: SMSMessage) => {
    try {
      setIsAnalyzing(true);
      console.log('🔍 Analyzing SMS:', message.id);

      const result = await smsReaderService.analyzeSMSMessage(message);
      
      // Store analysis result
      setAnalysisResults(prev => new Map(prev.set(message.id, result)));

      // Navigate to results screen
      navigation.navigate('ScanResult', {
        scanType: 'sms',
        result: {
          isSafe: result.riskLevel === 'SAFE',
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          details: result.recommendation,
          fraudIndicators: result.fraudIndicators,
          senderInfo: result.senderVerification,
          analysisDetails: result.analysisDetails,
          confidence: result.confidence,
          originalMessage: message.body,
          sender: message.address,
          timestamp: message.date
        }
      });

    } catch (error) {
      console.error('❌ Error analyzing SMS:', error);
      Alert.alert('Analysis Error', 'Failed to analyze SMS message. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBulkSMS = async () => {
    try {
      setIsAnalyzing(true);
      Alert.alert(
        '🔍 Bulk SMS Analysis',
        `Analyze ${filteredMessages.length} SMS messages for fraud?\n\nThis may take a few moments.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Analyze',
            onPress: async () => {
              try {
                const results = await smsReaderService.analyzeMultipleSMS(filteredMessages);
                
                // Store all results
                const newResults = new Map(analysisResults);
                results.forEach(result => {
                  newResults.set(result.message.id, result);
                });
                setAnalysisResults(newResults);

                // Show summary
                const fraudulent = results.filter(r => r.isFraudulent).length;
                const suspicious = results.filter(r => r.riskLevel === 'SUSPICIOUS').length;
                
                Alert.alert(
                  '📊 Analysis Complete',
                  `Analyzed ${results.length} messages:\n\n🚨 Fraudulent: ${fraudulent}\n⚠️ Suspicious: ${suspicious}\n✅ Safe: ${results.length - fraudulent - suspicious}`,
                  [
                    {
                      text: 'View Details',
                      onPress: () => showBulkAnalysisResults(results)
                    },
                    {
                      text: 'OK'
                    }
                  ]
                );
                
              } catch (error) {
                console.error('❌ Bulk analysis error:', error);
                Alert.alert('Error', 'Bulk analysis failed. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error in bulk analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showBulkAnalysisResults = (results: SMSAnalysisResult[]) => {
    const fraudulent = results.filter(r => r.isFraudulent);
    const suspicious = results.filter(r => r.riskLevel === 'SUSPICIOUS');
    
    let message = '📊 BULK ANALYSIS RESULTS\n\n';
    
    if (fraudulent.length > 0) {
      message += `🚨 FRAUDULENT MESSAGES (${fraudulent.length}):\n`;
      fraudulent.forEach((result, index) => {
        message += `${index + 1}. From: ${result.message.address}\n`;
        message += `   Risk: ${result.riskLevel}\n`;
        message += `   Indicators: ${result.fraudIndicators.slice(0, 2).join(', ')}\n\n`;
      });
    }
    
    if (suspicious.length > 0) {
      message += `⚠️ SUSPICIOUS MESSAGES (${suspicious.length}):\n`;
      suspicious.slice(0, 3).forEach((result, index) => {
        message += `${index + 1}. From: ${result.message.address}\n`;
        message += `   Risk: ${result.riskLevel}\n\n`;
      });
    }

    Alert.alert('Bulk Analysis Results', message, [{ text: 'OK' }]);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSMSMessages();
    setIsRefreshing(false);
  }, []);

  const renderSMSMessage = ({ item }: { item: SMSMessage }) => {
    const analysis = analysisResults.get(item.id);
    const isAnalyzed = !!analysis;
    
    return (
      <Card style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <Text style={styles.senderText}>{item.address}</Text>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.messageStatus}>
            {item.read === 0 && <View style={styles.unreadIndicator} />}
            {isAnalyzed && (
              <View style={[
                styles.riskIndicator,
                {
                  backgroundColor: 
                    analysis.riskLevel === 'CRITICAL' ? '#ff4444' :
                    analysis.riskLevel === 'HIGH_RISK' ? '#ff8800' :
                    analysis.riskLevel === 'SUSPICIOUS' ? '#ffaa00' : '#00aa44'
                }
              ]}>
                <Text style={styles.riskText}>
                  {analysis.riskLevel === 'CRITICAL' ? '🚨' :
                   analysis.riskLevel === 'HIGH_RISK' ? '⚠️' :
                   analysis.riskLevel === 'SUSPICIOUS' ? '⚠️' : '✅'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.messageBody} numberOfLines={3}>
          {item.body}
        </Text>
        
        {isAnalyzed && (
          <View style={styles.analysisPreview}>
            <Text style={styles.analysisText}>
              Risk: {analysis.riskLevel} ({analysis.riskScore}%)
            </Text>
            {analysis.fraudIndicators.length > 0 && (
              <Text style={styles.indicatorsText}>
                Indicators: {analysis.fraudIndicators.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.messageActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.analyzeButton]}
            onPress={() => analyzeSMSMessage(item)}
            disabled={isAnalyzing}
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {isAnalyzed ? 'Re-analyze' : 'Analyze'}
            </Text>
          </TouchableOpacity>
          
          {isAnalyzed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => navigation.navigate('ScanResult', {
                scanType: 'sms',
                result: {
                  isSafe: analysis.riskLevel === 'SAFE',
                  riskLevel: analysis.riskLevel,
                  riskScore: analysis.riskScore,
                  details: analysis.recommendation,
                  fraudIndicators: analysis.fraudIndicators,
                  senderInfo: analysis.senderVerification,
                  analysisDetails: analysis.analysisDetails,
                  confidence: analysis.confidence,
                  originalMessage: item.body,
                  sender: item.address,
                  timestamp: item.date
                }
              })}
            >
              <Ionicons name="eye" size={16} color="#007AFF" />
              <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>
                View Results
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  if (!serviceReady) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>SMS Scanner Not Ready</Text>
          <Text style={styles.emptySubtitle}>
            SMS reading permissions are required to analyze messages
          </Text>
          <Button
            title="Setup SMS Scanner"
            onPress={initializeSMSService}
            style={styles.setupButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📱 SMS Fraud Scanner</Text>
        <Text style={styles.headerSubtitle}>
          Manual SMS analysis • User-controlled detection
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search SMS messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {(['all', 'unread', 'suspicious'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter === 'all' ? 'All' : 
                 filter === 'unread' ? 'Unread' : 'Suspicious'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.bulkAnalyzeButton}
          onPress={analyzeBulkSMS}
          disabled={isAnalyzing || filteredMessages.length === 0}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.bulkAnalyzeText}>
            Analyze {filteredMessages.length} Messages
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* SMS Messages List */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading SMS messages...</Text>
        </View>
      ) : filteredMessages.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No SMS Messages</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No messages match your search' : 'No SMS messages found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          renderItem={renderSMSMessage}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Analysis Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.analysisOverlay}>
          <View style={styles.analysisModal}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.analysisText}>Analyzing SMS...</Text>
            <Text style={styles.analysisSubtext}>
              Checking for fraud patterns and threats
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bulkAnalyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  bulkAnalyzeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
  },
  messageCard: {
    marginBottom: 12,
    padding: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  riskIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskText: {
    fontSize: 12,
  },
  messageBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisPreview: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  indicatorsText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  setupButton: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisModal: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    margin: 40,
  },
  analysisSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SMSScannerScreen; 