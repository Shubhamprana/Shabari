/**
 * DeepScanProgressCard.tsx
 * 
 * Real-time progress display component for deep scan operations.
 * Shows current stage, file/app counters, time estimates, and percentage.
 * 
 * @module DeepScanProgressCard
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeepScanProgress } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanProgressCardProps {
  progress: DeepScanProgress;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

// ==================== COMPONENT ====================

export const DeepScanProgressCard: React.FC<DeepScanProgressCardProps> = ({
  progress,
  onCancel,
  onPause,
  onResume,
}) => {
  const progressAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress.percentage / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress.percentage]);

  const widthInterpolate = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStageIcon = (stage: string): string => {
    switch (stage) {
      case 'initializing':
        return 'cog';
      case 'permissions':
        return 'shield-check';
      case 'scanning_files':
        return 'file-search';
      case 'analyzing_apps':
        return 'cellphone';
      case 'scanning_folders':
        return 'folder-search';
      case 'scanning_social_media':
        return 'share-variant';
      case 'analyzing_threats':
        return 'alert-circle';
      case 'complete':
        return 'check-circle';
      case 'error':
        return 'alert';
      case 'cancelled':
        return 'cancel';
      case 'paused':
        return 'pause-circle';
      default:
        return 'radar';
    }
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'complete':
        return '#4ade80';
      case 'error':
        return '#f87171';
      case 'cancelled':
        return '#fbbf24';
      case 'paused':
        return '#fbbf24';
      default:
        return '#60a5fa';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={getStageIcon(progress.stage)}
            size={24}
            color={getStageColor(progress.stage)}
          />
          <View style={styles.headerText}>
            <Text style={styles.stageText}>{progress.message || progress.stage}</Text>
            {progress.subStage && (
              <Text style={styles.subStageText}>{progress.subStage}</Text>
            )}
          </View>
        </View>
        <Text style={styles.percentageText}>{Math.round(progress.percentage)}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: widthInterpolate,
              backgroundColor: getStageColor(progress.stage),
            },
          ]}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {progress.totalFiles > 0 && (
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="file" size={16} color="#94a3b8" />
            <Text style={styles.statValue}>
              {progress.filesScanned} / {progress.totalFiles}
            </Text>
            <Text style={styles.statLabel}>Files</Text>
          </View>
        )}

        {progress.totalApps > 0 && (
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="cellphone" size={16} color="#94a3b8" />
            <Text style={styles.statValue}>
              {progress.appsScanned} / {progress.totalApps}
            </Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
        )}

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="shield-alert" size={16} color="#f87171" />
          <Text style={styles.statValue}>{progress.threatsFound}</Text>
          <Text style={styles.statLabel}>Threats</Text>
        </View>

        {progress.estimatedTimeRemaining > 0 && (
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#94a3b8" />
            <Text style={styles.statValue}>
              {formatTime(progress.estimatedTimeRemaining)}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        )}
      </View>

      {/* Current Item */}
      {(progress.currentFile || progress.currentApp || progress.currentDirectory) && (
        <View style={styles.currentItemContainer}>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#64748b" />
          <Text style={styles.currentItemText} numberOfLines={1}>
            {progress.currentFile || progress.currentApp || progress.currentDirectory}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {(onCancel || onPause || onResume) && (
        <View style={styles.actionsContainer}>
          {progress.stage === 'paused' && onResume && (
            <TouchableOpacity style={styles.actionButton} onPress={onResume}>
              <MaterialCommunityIcons name="play" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          )}
          {progress.stage !== 'paused' && progress.stage !== 'complete' && onPause && (
            <TouchableOpacity style={styles.actionButton} onPress={onPause}>
              <MaterialCommunityIcons name="pause" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
          {onCancel && progress.stage !== 'complete' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <MaterialCommunityIcons name="close" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  stageText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  subStageText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  percentageText: {
    color: '#60a5fa',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  currentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  currentItemText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DeepScanProgressCard;

