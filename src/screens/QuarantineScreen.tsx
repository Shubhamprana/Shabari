import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';

// Check if RNFS is available with enhanced error handling
let RNFS: any = null;
let isRNFSAvailable = false;
let rnfsError: string | null = null;

try {
  RNFS = require('react-native-fs');
  isRNFSAvailable = true;
  console.log('✅ RNFS loaded successfully for QuarantineScreen');
} catch (error) {
  rnfsError = error instanceof Error ? error.message : 'Unknown RNFS error';
  console.log('⚠️ RNFS not available - using mock data for quarantine screen:', rnfsError);
}

interface QuarantinedFile {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  quarantineDate: Date;
  threatLevel: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
  threatName?: string;
  scanEngine?: string;
  details?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const QuarantineScreen: React.FC = () => {
  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<QuarantinedFile | null>(null);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    safeFiles: 0,
    threats: 0,
    totalSize: 0
  });

  // Load quarantined files from the quarantine folder with comprehensive error handling
  const loadQuarantinedFiles = useCallback(async () => {
    console.log('🔍 Starting to load quarantined files...');
    setError(null); // Clear any previous errors
    
    try {
      if (!isRNFSAvailable || !RNFS) {
        console.log('📱 RNFS not available - using mock data. Error:', rnfsError);
        // Mock data for development/web
        const mockFiles: QuarantinedFile[] = [
          {
            id: '1',
            fileName: '1703123456789_WhatsApp_Image_2024.jpg',
            originalFileName: 'WhatsApp_Image_2024.jpg',
            filePath: '/data/data/com.shabari.app/files/quarantine/1703123456789_WhatsApp_Image_2024.jpg',
            fileSize: 2547834,
            quarantineDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            threatLevel: 'SAFE',
            scanEngine: 'Shabari Local Scanner',
            details: 'Personal media file - privacy protected, local scan only'
          },
          {
            id: '2',
            fileName: '1703123500000_document.pdf',
            originalFileName: 'document.pdf',
            filePath: '/data/data/com.shabari.app/files/quarantine/1703123500000_document.pdf',
            fileSize: 1234567,
            quarantineDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            threatLevel: 'SAFE',
            scanEngine: 'Shabari Privacy Scanner',
            details: 'Personal document - privacy protected, not sent to cloud'
          },
          {
            id: '3',
            fileName: '1703123600000_suspicious_app.apk',
            originalFileName: 'suspicious_app.apk',
            filePath: '/data/data/com.shabari.app/files/quarantine/1703123600000_suspicious_app.apk',
            fileSize: 15728640,
            quarantineDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            threatLevel: 'MALICIOUS',
            threatName: 'Android.Trojan.FakeApp',
            scanEngine: 'VirusTotal + Shabari',
            details: 'Malicious Android application detected - DO NOT INSTALL'
          },
          {
            id: '4',
            fileName: '1703123700000_unknown_file.xyz',
            originalFileName: 'unknown_file.xyz',
            filePath: '/data/data/com.shabari.app/files/quarantine/1703123700000_unknown_file.xyz',
            fileSize: 512000,
            quarantineDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            threatLevel: 'SUSPICIOUS',
            scanEngine: 'Shabari Heuristic Scanner',
            details: 'Unknown file type - requires manual review'
          }
        ];
        setQuarantinedFiles(mockFiles);
        updateStats(mockFiles);
        console.log('✅ Mock quarantine data loaded successfully');
        return;
      }

      // Real implementation for native platform with enhanced error handling
      console.log('📁 Attempting to access quarantine folder...');
      const quarantinePath = `${RNFS.DocumentDirectoryPath}/quarantine`;
      console.log('📂 Quarantine path:', quarantinePath);
      
      // Check if quarantine folder exists with timeout protection
      let exists = false;
      try {
        console.log('🔍 Checking if quarantine folder exists...');
        exists = await Promise.race([
          RNFS.exists(quarantinePath),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout checking folder existence')), 5000))
        ]) as boolean;
        console.log('📁 Quarantine folder exists:', exists);
      } catch (existsError) {
        console.error('❌ Error checking quarantine folder existence:', existsError);
        setError('Unable to access quarantine folder. File system may be busy.');
        setQuarantinedFiles([]);
        updateStats([]);
        return;
      }

      if (!exists) {
        console.log('📁 Quarantine folder does not exist - showing empty state');
        setQuarantinedFiles([]);
        updateStats([]);
        return;
      }

      // Read quarantine folder contents with timeout protection
      let files: any[] = [];
      try {
        console.log('📂 Reading quarantine folder contents...');
        files = await Promise.race([
          RNFS.readDir(quarantinePath),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout reading folder contents')), 10000))
        ]) as any[];
        console.log('📁 Found', files.length, 'files in quarantine folder');
      } catch (readError) {
        console.error('❌ Error reading quarantine folder:', readError);
        setError('Unable to read quarantine folder contents. Please try again.');
        setQuarantinedFiles([]);
        updateStats([]);
        return;
      }

      const quarantinedFiles: QuarantinedFile[] = [];

      for (const file of files) {
        try {
          console.log('🔍 Processing file:', file.name);
          
          // Skip .meta files and hidden files
          if (file.name.startsWith('.') || file.name.endsWith('.meta')) {
            console.log('⏭️ Skipping metadata/hidden file:', file.name);
            continue;
          }

          // Parse filename to extract original name and timestamp
          const timestampMatch = file.name.match(/^(\d+)_(.+)$/);
          if (!timestampMatch) {
            console.log('⏭️ Skipping file with invalid naming format:', file.name);
            continue;
          }

          const timestamp = parseInt(timestampMatch[1]);
          const originalFileName = timestampMatch[2].replace(/_/g, ' ');
          
          // Get file stats with timeout protection
          let stats: any;
          try {
            stats = await Promise.race([
              RNFS.stat(file.path),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getting file stats')), 3000))
            ]);
          } catch (statError) {
            console.warn('⚠️ Error getting stats for file:', file.name, statError);
            // Use fallback stats
            stats = { size: 0 };
          }
          
          // Try to determine threat level from metadata file
          let threatLevel: QuarantinedFile['threatLevel'] = 'UNKNOWN';
          let threatName = undefined;
          let scanEngine = 'Shabari Scanner';
          let details = 'File quarantined for security analysis';

          // Check if metadata file exists
          const metadataPath = `${file.path}.meta`;
          try {
            const metadataExists = await RNFS.exists(metadataPath);
            if (metadataExists) {
              const metadataContent = await RNFS.readFile(metadataPath, 'utf8');
              const metadata = JSON.parse(metadataContent);
              threatLevel = metadata.threatLevel || threatLevel;
              threatName = metadata.threatName;
              scanEngine = metadata.scanEngine || scanEngine;
              details = metadata.details || details;
              console.log('📊 Loaded metadata for:', file.name, 'Threat level:', threatLevel);
            }
          } catch (metaError) {
            console.log('⚠️ No metadata found for', file.name, 'using heuristic analysis');
            // If no metadata, try to infer from file extension
            const ext = originalFileName.toLowerCase().split('.').pop() || '';
            if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf', 'doc', 'docx'].includes(ext)) {
              threatLevel = 'SAFE';
              details = 'Personal file - privacy protected';
            } else if (['exe', 'apk', 'dmg', 'msi'].includes(ext)) {
              threatLevel = 'SUSPICIOUS';
              details = 'Executable file - requires careful review';
            }
          }

          quarantinedFiles.push({
            id: file.name,
            fileName: file.name,
            originalFileName,
            filePath: file.path,
            fileSize: stats.size || 0,
            quarantineDate: new Date(timestamp),
            threatLevel,
            threatName,
            scanEngine,
            details
          });
          
          console.log('✅ Successfully processed file:', originalFileName);
        } catch (error) {
          console.warn('⚠️ Error processing quarantined file:', file.name, error);
          // Continue processing other files instead of failing completely
        }
      }

      // Sort by quarantine date (newest first)
      quarantinedFiles.sort((a, b) => b.quarantineDate.getTime() - a.quarantineDate.getTime());
      
      setQuarantinedFiles(quarantinedFiles);
      updateStats(quarantinedFiles);
      console.log('✅ Successfully loaded', quarantinedFiles.length, 'quarantined files');

    } catch (error) {
      console.error('❌ Critical error loading quarantined files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load quarantine folder: ${errorMessage}`);
      
      // Don't show alert immediately, just set error state
      setQuarantinedFiles([]);
      updateStats([]);
    }
  }, []);

  // Update statistics
  const updateStats = useCallback((files: QuarantinedFile[]) => {
    const newStats = {
      totalFiles: files.length,
      safeFiles: files.filter(f => f.threatLevel === 'SAFE').length,
      threats: files.filter(f => f.threatLevel === 'MALICIOUS').length,
      totalSize: files.reduce((sum, f) => sum + f.fileSize, 0)
    };
    setStats(newStats);
    console.log('📊 Updated stats:', newStats);
  }, []);

  // Load files on component mount with error boundary
  useEffect(() => {
    console.log('🚀 QuarantineScreen mounted, loading files...');
    loadQuarantinedFiles()
      .catch((error) => {
        console.error('❌ Error in useEffect loadQuarantinedFiles:', error);
        setError('Failed to initialize quarantine screen');
      })
      .finally(() => {
        setLoading(false);
        console.log('🏁 Loading completed');
      });
  }, [loadQuarantinedFiles]);

  // Refresh files with error handling
  const onRefresh = useCallback(async () => {
    console.log('🔄 Refreshing quarantine files...');
    setRefreshing(true);
    setError(null);
    try {
      await loadQuarantinedFiles();
    } catch (error) {
      console.error('❌ Error refreshing files:', error);
      setError('Failed to refresh quarantine folder');
    } finally {
      setRefreshing(false);
    }
  }, [loadQuarantinedFiles]);

  // Delete file from quarantine with enhanced error handling
  const deleteFile = async (file: QuarantinedFile) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to permanently delete "${file.originalFileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Attempting to delete file:', file.originalFileName);
            try {
              if (isRNFSAvailable && RNFS) {
                // Check if file exists before attempting deletion
                const fileExists = await Promise.race([
                  RNFS.exists(file.filePath),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout checking file existence')), 3000))
                ]) as boolean;
                
                if (!fileExists) {
                  console.log('⚠️ File does not exist, removing from list only');
                } else {
                  // Attempt to delete with timeout protection
                  await Promise.race([
                    RNFS.unlink(file.filePath),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout deleting file')), 5000))
                  ]);
                  console.log('✅ File deleted successfully:', file.filePath);
                }

                // Also try to delete metadata file if it exists
                try {
                  const metadataPath = `${file.filePath}.meta`;
                  const metadataExists = await RNFS.exists(metadataPath);
                  if (metadataExists) {
                    await RNFS.unlink(metadataPath);
                    console.log('🗑️ Metadata file deleted:', metadataPath);
                  }
                } catch (metaError) {
                  console.warn('⚠️ Failed to delete metadata file (non-critical):', metaError);
                }
              }
              
              // Remove from state regardless of file system operation success
              const updatedFiles = quarantinedFiles.filter(f => f.id !== file.id);
              setQuarantinedFiles(updatedFiles);
              updateStats(updatedFiles);
              
              Alert.alert('Success', 'File deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting file:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Delete Error', 
                `Failed to delete file: ${errorMessage}\n\nThe file may still be in the quarantine folder.`,
                [
                  { text: 'OK' },
                  {
                    text: 'Refresh',
                    onPress: onRefresh
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Restore safe file (move back to Downloads) with enhanced error handling
  const restoreFile = async (file: QuarantinedFile) => {
    if (file.threatLevel === 'MALICIOUS') {
      Alert.alert(
        'Cannot Restore',
        'This file is malicious and cannot be restored for your safety.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Restore File',
      `Restore "${file.originalFileName}" to Downloads folder?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            console.log('🔄 Attempting to restore file:', file.originalFileName);
            try {
              if (isRNFSAvailable && RNFS) {
                // Check if source file exists
                const sourceExists = await Promise.race([
                  RNFS.exists(file.filePath),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout checking source file')), 3000))
                ]) as boolean;
                
                if (!sourceExists) {
                  throw new Error('Source file no longer exists in quarantine');
                }

                // Ensure Downloads directory exists
                const downloadDir = RNFS.DownloadDirectoryPath;
                const downloadDirExists = await RNFS.exists(downloadDir);
                if (!downloadDirExists) {
                  console.log('📁 Creating Downloads directory...');
                  await RNFS.mkdir(downloadDir);
                }

                // Generate unique filename if file already exists in Downloads
                let destinationPath = `${downloadDir}/${file.originalFileName}`;
                let counter = 1;
                while (await RNFS.exists(destinationPath)) {
                  const fileExtension = file.originalFileName.split('.').pop();
                  const fileNameWithoutExt = file.originalFileName.replace(`.${fileExtension}`, '');
                  destinationPath = `${downloadDir}/${fileNameWithoutExt}_${counter}.${fileExtension}`;
                  counter++;
                }

                // Move file with timeout protection
                await Promise.race([
                  RNFS.moveFile(file.filePath, destinationPath),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout restoring file')), 10000))
                ]);
                
                console.log('✅ File restored successfully to:', destinationPath);

                // Clean up metadata file if it exists
                try {
                  const metadataPath = `${file.filePath}.meta`;
                  const metadataExists = await RNFS.exists(metadataPath);
                  if (metadataExists) {
                    await RNFS.unlink(metadataPath);
                    console.log('🗑️ Metadata cleaned up:', metadataPath);
                  }
                } catch (metaError) {
                  console.warn('⚠️ Failed to clean up metadata (non-critical):', metaError);
                }
              }
              
              // Remove from quarantine list
              const updatedFiles = quarantinedFiles.filter(f => f.id !== file.id);
              setQuarantinedFiles(updatedFiles);
              updateStats(updatedFiles);
              
              Alert.alert('Success', 'File restored to Downloads folder');
            } catch (error) {
              console.error('❌ Error restoring file:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Restore Error',
                `Failed to restore file: ${errorMessage}\n\nPlease try again or contact support.`,
                [
                  { text: 'OK' },
                  {
                    text: 'Refresh',
                    onPress: onRefresh
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Clear all safe files with enhanced error handling
  const clearSafeFiles = () => {
    const safeFiles = quarantinedFiles.filter(f => f.threatLevel === 'SAFE');
    if (safeFiles.length === 0) {
      Alert.alert('No Safe Files', 'There are no safe files to clear.');
      return;
    }

    Alert.alert(
      'Clear Safe Files',
      `Delete ${safeFiles.length} safe files from quarantine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Clearing', safeFiles.length, 'safe files...');
            let deletedCount = 0;
            let errors: string[] = [];
            
            try {
              if (isRNFSAvailable && RNFS) {
                for (const file of safeFiles) {
                  try {
                    // Check if file exists before deletion
                    const exists = await RNFS.exists(file.filePath);
                    if (exists) {
                      await Promise.race([
                        RNFS.unlink(file.filePath),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                      ]);
                    }
                    
                    // Clean up metadata
                    try {
                      const metadataPath = `${file.filePath}.meta`;
                      const metadataExists = await RNFS.exists(metadataPath);
                      if (metadataExists) {
                        await RNFS.unlink(metadataPath);
                      }
                    } catch (metaError) {
                      console.warn('⚠️ Failed to delete metadata for:', file.originalFileName);
                    }
                    
                    deletedCount++;
                    console.log('✅ Deleted safe file:', file.originalFileName);
                  } catch (error) {
                    console.error('❌ Failed to delete file:', file.originalFileName, error);
                    errors.push(file.originalFileName);
                  }
                }
              } else {
                deletedCount = safeFiles.length; // Mock deletion for web/development
              }
              
              // Update state to remove all safe files (even if some deletions failed)
              const updatedFiles = quarantinedFiles.filter(f => f.threatLevel !== 'SAFE');
              setQuarantinedFiles(updatedFiles);
              updateStats(updatedFiles);
              
              // Show result
              if (errors.length === 0) {
                Alert.alert('Success', `${deletedCount} safe files cleared successfully`);
              } else {
                Alert.alert(
                  'Partial Success',
                  `${deletedCount} files cleared successfully.\n${errors.length} files could not be deleted: ${errors.join(', ')}`,
                  [
                    { text: 'OK' },
                    {
                      text: 'Refresh',
                      onPress: onRefresh
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('❌ Critical error clearing safe files:', error);
              Alert.alert(
                'Clear Error',
                'Failed to clear safe files. Please try again.',
                [
                  { text: 'OK' },
                  {
                    text: 'Refresh',
                    onPress: onRefresh
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  // Get threat level icon and color
  const getThreatDisplay = (threatLevel: QuarantinedFile['threatLevel']) => {
    switch (threatLevel) {
      case 'SAFE':
        return { icon: '✅', color: '#4ecdc4', label: 'Safe' };
      case 'SUSPICIOUS':
        return { icon: '⚠️', color: '#ffa726', label: 'Suspicious' };
      case 'MALICIOUS':
        return { icon: '🚨', color: '#ef5350', label: 'Malicious' };
      default:
        return { icon: '❓', color: '#9e9e9e', label: 'Unknown' };
    }
  };

  // Render file item
  const renderFileItem = (file: QuarantinedFile) => {
    const threat = getThreatDisplay(file.threatLevel);
    
    return (
      <TouchableOpacity
        key={file.id}
        style={[styles.fileItem, { borderLeftColor: threat.color }]}
        onPress={() => {
          setSelectedFile(file);
          setShowFileDetails(true);
        }}
      >
        <View style={styles.fileHeader}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.originalFileName}
            </Text>
            <Text style={styles.fileDetails}>
              {formatFileSize(file.fileSize)} • {formatDate(file.quarantineDate)}
            </Text>
          </View>
          <View style={[styles.threatBadge, { backgroundColor: threat.color }]}>
            <Text style={styles.threatIcon}>{threat.icon}</Text>
          </View>
        </View>
        <View style={styles.fileActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteFile(file)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
          {file.threatLevel === 'SAFE' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={() => restoreFile(file)}
            >
              <Text style={styles.actionButtonText}>Restore</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render file details modal
  const renderFileDetailsModal = () => {
    if (!selectedFile) return null;
    
    const threat = getThreatDisplay(selectedFile.threatLevel);
    
    return (
      <Modal
        visible={showFileDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFileDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>File Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFileDetails(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>File Name</Text>
              <Text style={styles.detailValue}>{selectedFile.originalFileName}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Threat Level</Text>
              <View style={styles.threatDisplay}>
                <Text style={styles.threatIcon}>{threat.icon}</Text>
                <Text style={[styles.threatLabel, { color: threat.color }]}>
                  {threat.label}
                </Text>
              </View>
            </View>
            
            {selectedFile.threatName && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Threat Name</Text>
                <Text style={[styles.detailValue, { color: '#ef5350' }]}>
                  {selectedFile.threatName}
                </Text>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>File Size</Text>
              <Text style={styles.detailValue}>
                {formatFileSize(selectedFile.fileSize)}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Quarantined</Text>
              <Text style={styles.detailValue}>
                {selectedFile.quarantineDate.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Scan Engine</Text>
              <Text style={styles.detailValue}>{selectedFile.scanEngine}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Details</Text>
              <Text style={styles.detailDescription}>{selectedFile.details}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>File Path</Text>
              <Text style={[styles.detailValue, styles.pathText]}>
                {selectedFile.filePath}
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.deleteButton]}
              onPress={() => {
                setShowFileDetails(false);
                deleteFile(selectedFile);
              }}
            >
              <Text style={styles.actionButtonText}>Delete File</Text>
            </TouchableOpacity>
            
            {selectedFile.threatLevel === 'SAFE' && (
              <TouchableOpacity
                style={[styles.modalActionButton, styles.restoreButton]}
                onPress={() => {
                  setShowFileDetails(false);
                  restoreFile(selectedFile);
                }}
              >
                <Text style={styles.actionButtonText}>Restore File</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Quarantine" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ecdc4" />
          <Text style={styles.loadingText}>Loading quarantine folder...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Quarantine Folder" showBack={true} />
      
      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalFiles}</Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4ecdc4' }]}>
            {stats.safeFiles}
          </Text>
          <Text style={styles.statLabel}>Safe</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef5350' }]}>
            {stats.threats}
          </Text>
          <Text style={styles.statLabel}>Threats</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatFileSize(stats.totalSize)}</Text>
          <Text style={styles.statLabel}>Total Size</Text>
        </View>
      </View>

      {/* Action buttons */}
      {quarantinedFiles.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.clearButton} onPress={clearSafeFiles}>
            <Text style={styles.clearButtonText}>Clear Safe Files</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Access Quarantine Folder</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* File list */}
      <ScrollView
        style={styles.fileList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4ecdc4"
            colors={['#4ecdc4']}
          />
        }
      >
        {!error && quarantinedFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>Quarantine Folder Empty</Text>
            <Text style={styles.emptyDescription}>
              Files shared with Shabari are automatically quarantined here for security analysis.
              When you share files to the app, they will appear here.
            </Text>
            {!isRNFSAvailable && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                  Note: Running in development mode with mock data.
                  {rnfsError && ` RNFS Error: ${rnfsError}`}
                </Text>
              </View>
            )}
          </View>
        ) : !error ? (
          quarantinedFiles.map(renderFileItem)
        ) : null}
      </ScrollView>

      {renderFileDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#cccccc',
    fontSize: 12,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearButton: {
    backgroundColor: '#ffa726',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef5350',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#c62828',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#ef5350',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fileList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  debugInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#333344',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  debugText: {
    color: '#ffa726',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailSection: {
    marginVertical: 12,
  },
  detailLabel: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 16,
  },
  detailDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  pathText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#cccccc',
  },
  threatDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threatLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  fileItem: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileDetails: {
    color: '#cccccc',
    fontSize: 12,
  },
  threatBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatIcon: {
    fontSize: 16,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef5350',
  },
  restoreButton: {
    backgroundColor: '#4ecdc4',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});