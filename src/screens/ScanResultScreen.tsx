import React from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ScanResultScreenProps {
  route: {
    params?: {
      fileName?: string;
      url?: string;
      isSafe: boolean;
      threatName?: string;
      details?: string;
      downloadUrl?: string;
      isLoading?: boolean;
      scanEngine?: string;
    };
  };
  onGoBack: () => void;
}

const ScanResultScreen: React.FC<ScanResultScreenProps> = ({ route, onGoBack }) => {
  const params = route.params || { isSafe: false, details: 'No scan data available' };
  const { 
    fileName, 
    url, 
    isSafe, 
    threatName, 
    details, 
    downloadUrl, 
    isLoading,
    scanEngine = 'Shabari Advanced Scanner'
  } = params;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>
          Scanning {fileName || url || 'content'}...
        </Text>
        <Text style={styles.loadingSubtext}>Analyzing for threats and malware</Text>
      </View>
    );
  }

  const handleOpenInBrowser = async () => {
    if (isSafe && url) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          onGoBack();
        } else {
          Alert.alert('Error', 'Unable to open URL in browser');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open URL in browser');
      }
    }
  };

  const handleAction = () => {
    if (isSafe) {
      if (url) {
        // For URLs, offer to open in browser
        handleOpenInBrowser();
      } else {
        // For files, handle safe file action (save, open, etc.)
        console.log('File is safe, proceeding with action');
        onGoBack();
      }
    } else {
      // Handle dangerous content action (delete, quarantine)
      console.log('Content is dangerous, taking protective action');
      onGoBack();
    }
  };

  const displayName = fileName || url || 'Unknown content';

  return (
    <View style={[
      styles.container,
      { backgroundColor: isSafe ? '#1a2e1a' : '#2e1a1a' }
    ]}>
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isSafe ? '#4ecdc4' : '#ff6b6b' }
        ]}>
          <Text style={styles.icon}>
            {isSafe ? '✓' : '⚠'}
          </Text>
        </View>

        <Text style={styles.headline}>
          {isSafe ? (url ? 'Website is Safe' : 'File is Safe') : 'Threat Detected'}
        </Text>

        <Text style={styles.fileName}>{displayName}</Text>

        {threatName && (
          <View style={styles.threatContainer}>
            <Text style={styles.threatLabel}>Threat Type:</Text>
            <Text style={styles.threatName}>{threatName}</Text>
          </View>
        )}

        <Text style={styles.description}>
          {details || (isSafe
            ? (url 
                ? 'This website has been scanned and is safe to visit. No threats were detected.'
                : 'This file has been scanned and is safe to use. No threats were detected.'
              )
            : 'This content contains malicious material and has been blocked for your safety.'
          )}
        </Text>

        <View style={styles.actionContainer}>
          {isSafe && url && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4ecdc4' }]}
              onPress={handleOpenInBrowser}
            >
              <Text style={styles.actionButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          )}
          
          {isSafe && !url && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4ecdc4' }]}
              onPress={handleAction}
            >
              <Text style={styles.actionButtonText}>Save File</Text>
            </TouchableOpacity>
          )}

          {!isSafe && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ff6b6b' }]}
              onPress={handleAction}
            >
              <Text style={styles.actionButtonText}>
                {url ? 'Block Website' : 'Delete File'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onGoBack}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Scan Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scan Engine:</Text>
            <Text style={styles.detailValue}>{scanEngine}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scan Time:</Text>
            <Text style={styles.detailValue}>{new Date().toLocaleTimeString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Content Type:</Text>
            <Text style={styles.detailValue}>{url ? 'Website' : 'File'}</Text>
          </View>
          {url && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>URL:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{url}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#4ecdc4',
    borderTopColor: 'transparent',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#cccccc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  fileName: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  threatContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  threatLabel: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  threatName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cccccc',
  },
  secondaryButtonText: {
    color: '#cccccc',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ScanResultScreen;

