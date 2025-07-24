import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { manualSMSAnalyzer, SMSAnalysisResult } from '../services/ManualSMSAnalyzer';
import { SMSMessage, SMSReaderService } from '../services/SMSReaderService';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

interface ManualSMSScannerScreenProps {
  onNavigateBack?: () => void;
}

// Define a new type that combines the original message with its analysis result
type AnalyzedSMSMessage = SMSMessage & {
  analysis?: SMSAnalysisResult;
};

export const ManualSMSScannerScreen: React.FC<ManualSMSScannerScreenProps> = ({
  onNavigateBack
}) => {
  const [messages, setMessages] = useState<AnalyzedSMSMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLoadMessages = async () => {
    setIsLoading(true);
    try {
      const smsReader = SMSReaderService.getInstance();
      const loadedMessages = await smsReader.getSMSMessages({ messageType: 'inbox' });
      setMessages(loadedMessages);
    } catch (error) {
      Alert.alert('Error Loading Messages', 'Could not load SMS messages. Please ensure you have granted the necessary permissions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAnalyzeSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsAnalyzing(true);
    
    const messagesToAnalyze = messages.filter(msg => selectedIds.has(msg.id));

    try {
      for (const message of messagesToAnalyze) {
        // Create the input required by the analyzer
        const analysisInput = {
          senderInfo: message.address,
          messageContent: message.body,
          receivedTime: new Date(message.date),
        };
        const result = await manualSMSAnalyzer.analyzeSMS(analysisInput);

        // Update the message in our state with the analysis result
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, analysis: result } : m))
        );
      }
    } catch (error) {
        Alert.alert('Analysis Failed', 'An error occurred during the analysis.');
        console.error(error);
    }

    setIsAnalyzing(false);
    setSelectedIds(new Set()); // Clear selection after analysis
  };

  const renderMessageItem = ({ item }: { item: AnalyzedSMSMessage }) => {
    const isSelected = selectedIds.has(item.id);
    const hasBeenAnalyzed = !!item.analysis;
    const isDangerous = hasBeenAnalyzed && (item.analysis?.isFraud || item.analysis?.riskLevel === 'HIGH' || item.analysis?.riskLevel === 'CRITICAL');

    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          isSelected && styles.selectedItem,
          hasBeenAnalyzed && isDangerous && styles.dangerousItem,
          hasBeenAnalyzed && !isDangerous && styles.safeItem,
        ]}
        onPress={() => handleToggleSelection(item.id)}
      >
        <View style={styles.checkbox}>
          <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.sender}>{item.address}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          {hasBeenAnalyzed && (
            <Text style={isDangerous ? styles.analysisTextDanger : styles.analysisTextSafe}>
              Analysis: {item.analysis?.explanation.summary} (Risk: {item.analysis?.riskLevel})
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
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
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.title}>Manual SMS Scanner</Text>
            <Text style={styles.subtitle}>Load your messages to select which ones to analyze for threats.</Text>
            <TouchableOpacity style={styles.loadButton} onPress={handleLoadMessages} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Load My Messages</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
            />
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.analyzeButton, (selectedIds.size === 0 || isAnalyzing) && styles.disabledButton]} onPress={handleAnalyzeSelected} disabled={selectedIds.size === 0 || isAnalyzing}>
                {isAnalyzing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Analyze {selectedIds.size} Selected SMS</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a8b2d1',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#16213e',
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
  },
  selectedItem: {
    borderLeftColor: '#FF4500',
  },
  dangerousItem: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#d32f2f',
  },
  safeItem: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#32CD32',
  },
  checkbox: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sender: {
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#a8b2d1',
  },
  body: {
    color: '#a8b2d1',
  },
  analysisTextDanger: {
    marginTop: 10,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  analysisTextSafe: {
    marginTop: 10,
    color: '#32CD32',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  analyzeButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
});

export default ManualSMSScannerScreen; 