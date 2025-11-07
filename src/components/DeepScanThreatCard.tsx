/**
 * DeepScanThreatCard.tsx
 * 
 * Individual threat display card with expandable details,
 * severity indicator, and action buttons.
 * 
 * @module DeepScanThreatCard
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeepScanThreat, ThreatActionType } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanThreatCardProps {
  threat: DeepScanThreat;
  onAction: (action: ThreatActionType, threat: DeepScanThreat) => void;
  expanded?: boolean;
}

// ==================== COMPONENT ====================

export const DeepScanThreatCard: React.FC<DeepScanThreatCardProps> = ({
  threat,
  onAction,
  expanded: initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#fbbf24';
      case 'low':
        return '#60a5fa';
      default:
        return '#94a3b8';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'alert-octagon';
      case 'high':
        return 'alert';
      case 'medium':
        return 'alert-circle';
      case 'low':
        return 'information';
      default:
        return 'help-circle';
    }
  };

  const getThreatTypeIcon = (type: string): string => {
    switch (type) {
      case 'file':
        return 'file-alert';
      case 'app':
        return 'cellphone-alert';
      case 'permission':
        return 'shield-alert';
      case 'system':
        return 'alert-circle';
      default:
        return 'alert';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const severityColor = getSeverityColor(threat.severity);
  const severityIcon = getSeverityIcon(threat.severity);

  return (
    <View style={[styles.container, { borderLeftColor: severityColor }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${severityColor}20` }]}>
            <MaterialCommunityIcons
              name={getThreatTypeIcon(threat.type)}
              size={24}
              color={severityColor}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.threatName} numberOfLines={1}>
              {threat.threatName}
            </Text>
            <View style={styles.headerMeta}>
              <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
                <MaterialCommunityIcons name={severityIcon} size={12} color={severityColor} />
                <Text style={[styles.severityText, { color: severityColor }]}>
                  {threat.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.fileName} numberOfLines={1}>
                {threat.fileName}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>{threat.description}</Text>
          </View>

          {/* Details */}
          {threat.details && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <Text style={styles.sectionText}>{threat.details}</Text>
            </View>
          )}

          {/* File Info */}
          {threat.filePath && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>File Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Path:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {threat.filePath}
                </Text>
              </View>
              {threat.fileSize > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Size:</Text>
                  <Text style={styles.infoValue}>{formatFileSize(threat.fileSize)}</Text>
                </View>
              )}
              {threat.fileHash && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hash:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {threat.fileHash.substring(0, 16)}...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Scan Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Engine:</Text>
              <Text style={styles.infoValue}>{threat.scanEngine}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Confidence:</Text>
              <Text style={styles.infoValue}>{threat.confidence}%</Text>
            </View>
            {threat.yaraRules && threat.yaraRules.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>YARA Rules:</Text>
                <Text style={styles.infoValue}>{threat.yaraRules.join(', ')}</Text>
              </View>
            )}
          </View>

          {/* Recommendations */}
          {threat.recommendations && threat.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {threat.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialCommunityIcons name="lightbulb" size={16} color="#fbbf24" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          {threat.actions && threat.actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {threat.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.isDestructive && styles.destructiveButton,
                  ]}
                  onPress={() => onAction(action.action as ThreatActionType, threat)}
                >
                  <MaterialCommunityIcons
                    name={
                      action.action === 'quarantine'
                        ? 'shield-lock'
                        : action.action === 'delete'
                        ? 'delete'
                        : action.action === 'view_details'
                        ? 'eye'
                        : 'check'
                    }
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  threatName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fileName: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    width: 80,
    fontWeight: '600',
  },
  infoValue: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DeepScanThreatCard;

