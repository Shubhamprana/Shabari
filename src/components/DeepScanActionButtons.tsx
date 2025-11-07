/**
 * DeepScanActionButtons.tsx
 * 
 * Threat action buttons component for quarantine, delete, ignore,
 * view details, and batch actions.
 * 
 * @module DeepScanActionButtons
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeepScanThreat, ThreatActionType } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanActionButtonsProps {
  threat: DeepScanThreat;
  onAction: (action: ThreatActionType, threat: DeepScanThreat) => void;
  showBatchActions?: boolean;
  onBatchQuarantine?: (threats: DeepScanThreat[]) => void;
  onBatchDelete?: (threats: DeepScanThreat[]) => void;
  selectedThreats?: DeepScanThreat[];
}

// ==================== COMPONENT ====================

export const DeepScanActionButtons: React.FC<DeepScanActionButtonsProps> = ({
  threat,
  onAction,
  showBatchActions = false,
  onBatchQuarantine,
  onBatchDelete,
  selectedThreats = [],
}) => {
  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'quarantine':
        return 'shield-lock';
      case 'delete':
        return 'delete';
      case 'ignore':
        return 'check-circle';
      case 'scan_again':
        return 'refresh';
      case 'view_details':
        return 'eye';
      default:
        return 'information';
    }
  };

  const getActionColor = (action: string, isDestructive: boolean): string => {
    if (isDestructive) return '#ef4444';
    switch (action) {
      case 'quarantine':
        return '#3b82f6';
      case 'view_details':
        return '#60a5fa';
      case 'ignore':
        return '#4ade80';
      case 'scan_again':
        return '#fbbf24';
      default:
        return '#94a3b8';
    }
  };

  const handleAction = (action: ThreatActionType) => {
    onAction(action, threat);
  };

  return (
    <View style={styles.container}>
      {/* Individual Threat Actions */}
      {threat.actions && threat.actions.length > 0 && (
        <View style={styles.actionsRow}>
          {threat.actions.map((action, index) => {
            const actionColor = getActionColor(action.action, action.isDestructive);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { backgroundColor: `${actionColor}20`, borderColor: actionColor }]}
                onPress={() => handleAction(action.action as ThreatActionType)}
              >
                <MaterialCommunityIcons
                  name={getActionIcon(action.action)}
                  size={18}
                  color={actionColor}
                />
                <Text style={[styles.actionButtonText, { color: actionColor }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Batch Actions */}
      {showBatchActions && selectedThreats.length > 0 && (
        <View style={styles.batchActionsContainer}>
          <Text style={styles.batchActionsTitle}>
            Batch Actions ({selectedThreats.length} selected)
          </Text>
          <View style={styles.batchActionsRow}>
            {onBatchQuarantine && (
              <TouchableOpacity
                style={[styles.batchActionButton, styles.quarantineButton]}
                onPress={() => onBatchQuarantine(selectedThreats)}
              >
                <MaterialCommunityIcons name="shield-lock" size={20} color="#fff" />
                <Text style={styles.batchActionButtonText}>Quarantine All</Text>
              </TouchableOpacity>
            )}
            {onBatchDelete && (
              <TouchableOpacity
                style={[styles.batchActionButton, styles.deleteButton]}
                onPress={() => onBatchDelete(selectedThreats)}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.batchActionButtonText}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.primaryAction]}
          onPress={() => handleAction('view_details')}
        >
          <MaterialCommunityIcons name="eye" size={18} color="#fff" />
          <Text style={styles.quickActionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.secondaryAction]}
          onPress={() => handleAction('quarantine')}
        >
          <MaterialCommunityIcons name="shield-lock" size={18} color="#60a5fa" />
          <Text style={[styles.quickActionText, styles.secondaryActionText]}>Quarantine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  batchActionsContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  batchActionsTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  batchActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  quarantineButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  batchActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
  },
  secondaryAction: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionText: {
    color: '#60a5fa',
  },
});

export default DeepScanActionButtons;

