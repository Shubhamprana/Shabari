/**
 * DeepScanResultSummary.tsx
 * 
 * Scan result summary component showing overall scan summary,
 * threat overview, statistics, recommendations, and action buttons.
 * 
 * @module DeepScanResultSummary
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeepScanResult, DeepScanThreat } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanResultSummaryProps {
  result: DeepScanResult;
  onViewThreat: (threat: DeepScanThreat) => void;
  onExport?: () => void;
}

// ==================== COMPONENT ====================

export const DeepScanResultSummary: React.FC<DeepScanResultSummaryProps> = ({
  result,
  onViewThreat,
  onExport,
}) => {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getThreatCountBySeverity = (severity: string): number => {
    return result.statistics.threatsBySeverity[severity] || 0;
  };

  const getThreatCountByType = (type: string): number => {
    return result.statistics.threatsByType[type] || 0;
  };

  const hasThreats = result.threatsDetected.length > 0;
  const criticalThreats = getThreatCountBySeverity('critical');
  const highThreats = getThreatCountBySeverity('high');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={[styles.statusHeader, hasThreats ? styles.statusHeaderThreats : styles.statusHeaderSafe]}>
        <MaterialCommunityIcons
          name={hasThreats ? 'shield-alert' : 'shield-check'}
          size={48}
          color="#fff"
        />
        <Text style={styles.statusTitle}>
          {hasThreats ? 'Threats Detected!' : 'Device is Clean'}
        </Text>
        <Text style={styles.statusSubtitle}>
          {hasThreats
            ? `${result.threatsDetected.length} threat(s) found during scan`
            : `Scanned ${result.totalFilesScanned} files - No threats detected`}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatValue}>{result.totalFilesScanned}</Text>
          <Text style={styles.quickStatLabel}>Files</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatValue}>{result.totalAppsScanned}</Text>
          <Text style={styles.quickStatLabel}>Apps</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatValue, hasThreats && styles.quickStatValueThreat]}>
            {result.threatsDetected.length}
          </Text>
          <Text style={styles.quickStatLabel}>Threats</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatValue}>{formatDuration(result.scanDuration)}</Text>
          <Text style={styles.quickStatLabel}>Duration</Text>
        </View>
      </View>

      {/* Threat Overview */}
      {hasThreats && (
        <View style={styles.threatOverview}>
          <Text style={styles.sectionTitle}>Threat Overview</Text>
          
          {criticalThreats > 0 && (
            <View style={[styles.threatAlert, styles.criticalAlert]}>
              <MaterialCommunityIcons name="alert-octagon" size={24} color="#ef4444" />
              <View style={styles.threatAlertContent}>
                <Text style={styles.threatAlertTitle}>
                  {criticalThreats} Critical Threat(s)
                </Text>
                <Text style={styles.threatAlertText}>
                  Immediate action required. These threats pose serious security risks.
                </Text>
              </View>
            </View>
          )}

          {highThreats > 0 && (
            <View style={[styles.threatAlert, styles.highAlert]}>
              <MaterialCommunityIcons name="alert" size={24} color="#f97316" />
              <View style={styles.threatAlertContent}>
                <Text style={styles.threatAlertTitle}>
                  {highThreats} High Risk Threat(s)
                </Text>
                <Text style={styles.threatAlertText}>
                  Review and take appropriate action soon.
                </Text>
              </View>
            </View>
          )}

          {/* Threat Type Breakdown */}
          <View style={styles.threatTypeGrid}>
            {getThreatCountByType('malware') > 0 && (
              <View style={styles.threatTypeItem}>
                <MaterialCommunityIcons name="virus" size={20} color="#ef4444" />
                <Text style={styles.threatTypeValue}>{getThreatCountByType('malware')}</Text>
                <Text style={styles.threatTypeLabel}>Malware</Text>
              </View>
            )}
            {getThreatCountByType('suspicious_apk') > 0 && (
              <View style={styles.threatTypeItem}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#f97316" />
                <Text style={styles.threatTypeValue}>{getThreatCountByType('suspicious_apk')}</Text>
                <Text style={styles.threatTypeLabel}>Suspicious APK</Text>
              </View>
            )}
            {getThreatCountByType('risky_permissions') > 0 && (
              <View style={styles.threatTypeItem}>
                <MaterialCommunityIcons name="shield-alert" size={20} color="#fbbf24" />
                <Text style={styles.threatTypeValue}>{getThreatCountByType('risky_permissions')}</Text>
                <Text style={styles.threatTypeLabel}>Risky Permissions</Text>
              </View>
            )}
            {getThreatCountByType('social_media_threat') > 0 && (
              <View style={styles.threatTypeItem}>
                <MaterialCommunityIcons name="share-variant" size={20} color="#60a5fa" />
                <Text style={styles.threatTypeValue}>{getThreatCountByType('social_media_threat')}</Text>
                <Text style={styles.threatTypeLabel}>Social Media</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {hasThreats && (
        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationList}>
            {criticalThreats > 0 && (
              <View style={styles.recommendationItem}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.recommendationText}>
                  Review and quarantine {criticalThreats} critical threat(s) immediately
                </Text>
              </View>
            )}
            {highThreats > 0 && (
              <View style={styles.recommendationItem}>
                <MaterialCommunityIcons name="shield-alert" size={20} color="#f97316" />
                <Text style={styles.recommendationText}>
                  Review {highThreats} high-risk threat(s) and take appropriate action
                </Text>
              </View>
            )}
            <View style={styles.recommendationItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#60a5fa" />
              <Text style={styles.recommendationText}>
                Consider running a full scan weekly to maintain device security
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {hasThreats && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (result.threatsDetected.length > 0) {
                onViewThreat(result.threatsDetected[0]);
              }
            }}
          >
            <MaterialCommunityIcons name="shield-search" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View All Threats</Text>
          </TouchableOpacity>
        )}
        {onExport && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onExport}>
            <MaterialCommunityIcons name="export" size={20} color="#60a5fa" />
            <Text style={styles.secondaryButtonText}>Export Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scan Info */}
      <View style={styles.scanInfo}>
        <Text style={styles.scanInfoText}>
          Scan completed on {new Date(result.scanEndTime).toLocaleString()}
        </Text>
        <Text style={styles.scanInfoText}>
          Scan ID: {result.scanId}
        </Text>
      </View>
    </ScrollView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  statusHeader: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 16,
  },
  statusHeaderSafe: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  statusHeaderThreats: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  statusTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  statusSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickStatValueThreat: {
    color: '#ef4444',
  },
  quickStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  threatOverview: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  threatAlert: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  criticalAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  highAlert: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  threatAlertContent: {
    flex: 1,
  },
  threatAlertTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  threatAlertText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  threatTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  threatTypeItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  threatTypeValue: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  threatTypeLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  recommendations: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  recommendationList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    margin: 16,
    marginTop: 0,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  scanInfo: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    alignItems: 'center',
  },
  scanInfoText: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
});

export default DeepScanResultSummary;

