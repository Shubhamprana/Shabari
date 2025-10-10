/**
 * Admin Reports Screen
 * Screen for reviewing and managing user reports
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

interface Report {
  id: string;
  target: string;
  type: string;
  action: string;
  device_id?: string;
  details?: string;
  timestamp: number;
  reviewed: boolean;
  review_decision?: string;
  reviewed_at?: string;
  created_at: string;
}

export const AdminReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadReports = async () => {
    try {
      let query = supabase
        .from('proxy_reports')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filter === 'pending') {
        query = query.eq('reviewed', false);
      } else if (filter === 'reviewed') {
        query = query.eq('reviewed', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleFilterChange = (newFilter: 'all' | 'pending' | 'reviewed') => {
    setFilter(newFilter);
    setLoading(true);
    loadReports();
  };

  const handleReportAction = async (report: Report, action: 'approve' | 'reject') => {
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('proxy_reports')
        .update({
          reviewed: true,
          review_decision: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (reportError) throw reportError;

      // If approved, add to threat database
      if (action === 'approve') {
        const tableName = report.type === 'domain' ? 'fraud_domains' : 
                         report.type === 'phone' ? 'fraud_numbers' : 
                         report.type === 'ip' ? 'fraud_ips' : null;

        if (tableName) {
          const threatData = {
            [report.type === 'domain' ? 'domain' : 
             report.type === 'phone' ? 'number' : 'range']: report.target,
            type: report.type,
            category: 'user_reported',
            severity: 70,
            active: true,
            report_count: 1,
            description: report.details || 'User reported threat',
            metadata: {
              source: 'admin_approved',
              original_report_id: report.id,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: threatError } = await supabase
            .from(tableName)
            .upsert(threatData);

          if (threatError) {
            console.warn('Failed to add threat to database:', threatError);
          }
        }
      }

      Alert.alert('Success', `Report ${action}d successfully`);
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked': return '#EF4444';
      case 'warned': return '#F59E0B';
      case 'reported': return '#3B82F6';
      default: return '#64748B';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return 'globe';
      case 'phone': return 'call';
      case 'ip': return 'server';
      default: return 'warning';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  useEffect(() => {
    loadReports();
  }, [filter]);

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        setSelectedReport(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={20} 
            color="#3B82F6" 
          />
          <Text style={styles.reportTarget}>{item.target}</Text>
        </View>
        <View style={[
          styles.actionBadge, 
          { backgroundColor: getActionColor(item.action) }
        ]}>
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
      </View>
      
      <View style={styles.reportDetails}>
        <Text style={styles.reportType}>{item.type.toUpperCase()}</Text>
        <Text style={styles.reportTime}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      
      {item.details && (
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.details}
        </Text>
      )}

      {item.reviewed && (
        <View style={styles.reviewStatus}>
          <Ionicons 
            name={item.review_decision === 'approve' ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={item.review_decision === 'approve' ? '#10B981' : '#EF4444'} 
          />
          <Text style={[
            styles.reviewText,
            { color: item.review_decision === 'approve' ? '#10B981' : '#EF4444' }
          ]}>
            {item.review_decision === 'approve' ? 'Approved' : 'Rejected'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: 'all' | 'pending' | 'reviewed', label: string) => (
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
        <Text style={styles.headerTitle}>Report Management</Text>
        <Text style={styles.headerSubtitle}>
          {reports.filter(r => !r.reviewed).length} pending, {reports.length} total
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('reviewed', 'Reviewed')}
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No reports available' : `No ${filter} reports`}
            </Text>
          </View>
        }
      />

      {/* Report Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {selectedReport && (
            <View style={styles.modalContent}>
              <View style={styles.modalReportInfo}>
                <Text style={styles.modalReportTarget}>{selectedReport.target}</Text>
                <Text style={styles.modalReportType}>{selectedReport.type.toUpperCase()}</Text>
                <Text style={styles.modalReportAction}>
                  Action: {selectedReport.action}
                </Text>
                <Text style={styles.modalReportTime}>
                  Time: {formatTimestamp(selectedReport.timestamp)}
                </Text>
                {selectedReport.device_id && (
                  <Text style={styles.modalReportDevice}>
                    Device: {selectedReport.device_id.substring(0, 8)}...
                  </Text>
                )}
              </View>

              {selectedReport.details && (
                <View style={styles.modalDescription}>
                  <Text style={styles.modalDescriptionTitle}>Details</Text>
                  <Text style={styles.modalDescriptionText}>{selectedReport.details}</Text>
                </View>
              )}

              {selectedReport.reviewed ? (
                <View style={styles.reviewedStatus}>
                  <Ionicons 
                    name={selectedReport.review_decision === 'approve' ? 'checkmark-circle' : 'close-circle'} 
                    size={32} 
                    color={selectedReport.review_decision === 'approve' ? '#10B981' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.reviewedText,
                    { color: selectedReport.review_decision === 'approve' ? '#10B981' : '#EF4444' }
                  ]}>
                    {selectedReport.review_decision === 'approve' ? 'Approved' : 'Rejected'}
                  </Text>
                  <Text style={styles.reviewedTime}>
                    {selectedReport.reviewed_at ? new Date(selectedReport.reviewed_at).toLocaleString() : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => {
                      handleReportAction(selectedReport, 'approve');
                      setModalVisible(false);
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => {
                      handleReportAction(selectedReport, 'reject');
                      setModalVisible(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  reportTime: {
    fontSize: 14,
    color: '#64748B',
  },
  reportDescription: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  modalReportInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  modalReportTarget: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalReportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  modalReportAction: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  modalReportTime: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  modalReportDevice: {
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
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  reviewedStatus: {
    alignItems: 'center',
    padding: 20,
  },
  reviewedText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  reviewedTime: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
});
