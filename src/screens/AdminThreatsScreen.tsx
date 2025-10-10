/**
 * Admin Threats Management Screen
 * Screen for managing and reviewing threats
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface Threat {
  id: string;
  domain?: string;
  number?: string;
  range?: string;
  type: 'domain' | 'phone' | 'ip';
  category: string;
  severity: number;
  active: boolean;
  description?: string;
  report_count: number;
  created_at: string;
}

export const AdminThreatsScreen: React.FC = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'domain' | 'phone' | 'ip'>('all');
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadThreats = async () => {
    try {
      let allThreats: Threat[] = [];

      if (filter === 'all' || filter === 'domain') {
        const { data: domains, error } = await supabase
          .from('fraud_domains')
          .select('*')
          .eq('active', true)
          .order('severity', { ascending: false });

        if (!error && domains) {
          allThreats.push(...domains.map(d => ({ ...d, type: 'domain' as const })));
        }
      }

      if (filter === 'all' || filter === 'phone') {
        const { data: numbers, error } = await supabase
          .from('fraud_numbers')
          .select('*')
          .eq('active', true)
          .order('severity', { ascending: false });

        if (!error && numbers) {
          allThreats.push(...numbers.map(n => ({ ...n, type: 'phone' as const })));
        }
      }

      if (filter === 'all' || filter === 'ip') {
        const { data: ips, error } = await supabase
          .from('fraud_ips')
          .select('*')
          .eq('active', true)
          .order('severity', { ascending: false });

        if (!error && ips) {
          allThreats.push(...ips.map(i => ({ ...i, type: 'ip' as const })));
        }
      }

      setThreats(allThreats);
    } catch (error) {
      console.error('Error loading threats:', error);
      Alert.alert('Error', 'Failed to load threats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadThreats();
  };

  const handleFilterChange = (newFilter: 'all' | 'domain' | 'phone' | 'ip') => {
    setFilter(newFilter);
    setLoading(true);
    loadThreats();
  };

  const handleThreatAction = async (threat: Threat, action: 'approve' | 'reject' | 'monitor') => {
    try {
      const tableName = threat.type === 'domain' ? 'fraud_domains' : 
                       threat.type === 'phone' ? 'fraud_numbers' : 'fraud_ips';

      const updates = {
        reviewed: true,
        reviewed_at: new Date().toISOString(),
        review_decision: action,
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updates.active = true;
        updates.severity = 80;
      } else if (action === 'reject') {
        updates.active = false;
        updates.severity = 0;
      } else if (action === 'monitor') {
        updates.active = true;
        updates.severity = 30;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', threat.id);

      if (error) throw error;

      Alert.alert('Success', `Threat ${action}d successfully`);
      loadThreats();
    } catch (error) {
      console.error('Error updating threat:', error);
      Alert.alert('Error', 'Failed to update threat');
    }
  };

  const getThreatValue = (threat: Threat) => {
    return threat.domain || threat.number || threat.range || 'Unknown';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return '#EF4444';
    if (severity >= 50) return '#F59E0B';
    return '#10B981';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return 'globe';
      case 'phone': return 'call';
      case 'ip': return 'server';
      default: return 'warning';
    }
  };

  useEffect(() => {
    loadThreats();
  }, [filter]);

  const renderThreatItem = ({ item }: { item: Threat }) => (
    <TouchableOpacity
      style={styles.threatCard}
      onPress={() => {
        setSelectedThreat(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.threatHeader}>
        <View style={styles.threatInfo}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={20} 
            color="#3B82F6" 
          />
          <Text style={styles.threatValue}>{getThreatValue(item)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>
      
      <View style={styles.threatDetails}>
        <Text style={styles.threatCategory}>{item.category}</Text>
        <Text style={styles.threatReports}>{item.report_count} reports</Text>
      </View>
      
      {item.description && (
        <Text style={styles.threatDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: 'all' | 'domain' | 'phone' | 'ip', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Threat Management</Text>
        <Text style={styles.headerSubtitle}>{threats.length} active threats</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('domain', 'Domains')}
        {renderFilterButton('phone', 'Phones')}
        {renderFilterButton('ip', 'IPs')}
      </View>

      <FlatList
        data={threats}
        renderItem={renderThreatItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>No threats found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No active threats' : `No active ${filter} threats`}
            </Text>
          </View>
        }
      />

      {/* Threat Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Threat Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {selectedThreat && (
            <View style={styles.modalContent}>
              <View style={styles.modalThreatInfo}>
                <Text style={styles.modalThreatValue}>{getThreatValue(selectedThreat)}</Text>
                <Text style={styles.modalThreatType}>{selectedThreat.type.toUpperCase()}</Text>
                <Text style={styles.modalThreatCategory}>{selectedThreat.category}</Text>
                <Text style={styles.modalThreatSeverity}>
                  Severity: {selectedThreat.severity}/100
                </Text>
                <Text style={styles.modalThreatReports}>
                  Reports: {selectedThreat.report_count}
                </Text>
              </View>

              {selectedThreat.description && (
                <View style={styles.modalDescription}>
                  <Text style={styles.modalDescriptionTitle}>Description</Text>
                  <Text style={styles.modalDescriptionText}>{selectedThreat.description}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => {
                    handleThreatAction(selectedThreat, 'approve');
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.monitorButton]}
                  onPress={() => {
                    handleThreatAction(selectedThreat, 'monitor');
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Monitor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    handleThreatAction(selectedThreat, 'reject');
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    padding: 20,
  },
  threatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  threatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  threatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  threatCategory: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  threatReports: {
    fontSize: 14,
    color: '#64748B',
  },
  threatDescription: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalThreatInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  modalThreatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalThreatType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  modalThreatCategory: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  modalThreatSeverity: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  modalThreatReports: {
    fontSize: 14,
    color: '#64748B',
  },
  modalDescription: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  modalDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  monitorButton: {
    backgroundColor: '#F59E0B',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
