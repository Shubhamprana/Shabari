/**
 * DeepScanStatisticsCard.tsx
 * 
 * Scan statistics display component showing files scanned,
 * threats found, scan duration, and performance metrics.
 * 
 * @module DeepScanStatisticsCard
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeepScanResult } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanStatisticsCardProps {
  result: DeepScanResult;
}

// ==================== COMPONENT ====================

export const DeepScanStatisticsCard: React.FC<DeepScanStatisticsCardProps> = ({ result }) => {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getThreatCountBySeverity = (severity: string): number => {
    return result.statistics.threatsBySeverity[severity] || 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-box" size={24} color="#60a5fa" />
        <Text style={styles.title}>Scan Statistics</Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="file" size={32} color="#60a5fa" />
          <Text style={styles.statValue}>{result.totalFilesScanned}</Text>
          <Text style={styles.statLabel}>Files Scanned</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="shield-alert" size={32} color="#ef4444" />
          <Text style={styles.statValue}>{result.threatsDetected.length}</Text>
          <Text style={styles.statLabel}>Threats Found</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock-outline" size={32} color="#fbbf24" />
          <Text style={styles.statValue}>{formatDuration(result.scanDuration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="cellphone" size={32} color="#4ade80" />
          <Text style={styles.statValue}>{result.totalAppsScanned}</Text>
          <Text style={styles.statLabel}>Apps Scanned</Text>
        </View>
      </View>

      {/* Threat Breakdown */}
      {result.threatsDetected.length > 0 && (
        <View style={styles.threatBreakdown}>
          <Text style={styles.sectionTitle}>Threat Breakdown</Text>
          <View style={styles.threatGrid}>
            <View style={[styles.threatItem, { borderLeftColor: '#ef4444' }]}>
              <Text style={[styles.threatValue, { color: '#ef4444' }]}>
                {getThreatCountBySeverity('critical')}
              </Text>
              <Text style={styles.threatLabel}>Critical</Text>
            </View>
            <View style={[styles.threatItem, { borderLeftColor: '#f97316' }]}>
              <Text style={[styles.threatValue, { color: '#f97316' }]}>
                {getThreatCountBySeverity('high')}
              </Text>
              <Text style={styles.threatLabel}>High</Text>
            </View>
            <View style={[styles.threatItem, { borderLeftColor: '#fbbf24' }]}>
              <Text style={[styles.threatValue, { color: '#fbbf24' }]}>
                {getThreatCountBySeverity('medium')}
              </Text>
              <Text style={styles.threatLabel}>Medium</Text>
            </View>
            <View style={[styles.threatItem, { borderLeftColor: '#60a5fa' }]}>
              <Text style={[styles.threatValue, { color: '#60a5fa' }]}>
                {getThreatCountBySeverity('low')}
              </Text>
              <Text style={styles.threatLabel}>Low</Text>
            </View>
          </View>
        </View>
      )}

      {/* Performance Metrics */}
      {result.statistics.averageScanTimePerFile > 0 && (
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Avg Time/File:</Text>
            <Text style={styles.performanceValue}>
              {result.statistics.averageScanTimePerFile.toFixed(2)}ms
            </Text>
          </View>
          {result.statistics.fastestScanTime > 0 && (
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Fastest:</Text>
              <Text style={styles.performanceValue}>
                {result.statistics.fastestScanTime.toFixed(2)}ms
              </Text>
            </View>
          )}
          {result.statistics.slowestScanTime > 0 && (
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Slowest:</Text>
              <Text style={styles.performanceValue}>
                {result.statistics.slowestScanTime.toFixed(2)}ms
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Device Info */}
      {result.deviceInfo && (
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>Platform:</Text>
            <Text style={styles.deviceValue}>{result.deviceInfo.platform}</Text>
          </View>
          {result.deviceInfo.totalStorage > 0 && (
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Total Storage:</Text>
              <Text style={styles.deviceValue}>
                {formatFileSize(result.deviceInfo.totalStorage)}
              </Text>
            </View>
          )}
          {result.deviceInfo.freeStorage > 0 && (
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Free Storage:</Text>
              <Text style={styles.deviceValue}>
                {formatFileSize(result.deviceInfo.freeStorage)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Scan Engine Info */}
      <View style={styles.engineSection}>
        <Text style={styles.sectionTitle}>Scan Engine</Text>
        <View style={styles.engineRow}>
          <Text style={styles.engineLabel}>Version:</Text>
          <Text style={styles.engineValue}>{result.scanEngineVersion}</Text>
        </View>
        <View style={styles.engineRow}>
          <Text style={styles.engineLabel}>YARA Engine:</Text>
          <Text style={styles.engineValue}>
            {result.isNativeYaraUsed ? '✅ Enabled' : '❌ Disabled'}
          </Text>
        </View>
        {result.yaraRulesMatched && result.yaraRulesMatched.length > 0 && (
          <View style={styles.engineRow}>
            <Text style={styles.engineLabel}>YARA Rules Matched:</Text>
            <Text style={styles.engineValue}>{result.yaraRulesMatched.length}</Text>
          </View>
        )}
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  threatBreakdown: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  threatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  threatItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  threatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  threatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  performanceSection: {
    marginBottom: 20,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  performanceLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  performanceValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  deviceSection: {
    marginBottom: 20,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deviceLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  deviceValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  engineSection: {},
  engineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  engineLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  engineValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DeepScanStatisticsCard;

