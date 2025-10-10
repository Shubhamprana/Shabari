/**
 * Admin Dashboard Screen
 * Main admin panel for threat management and monitoring
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');

interface AdminStats {
  domains: { total: number; active: number; high_severity: number };
  numbers: { total: number; active: number; high_severity: number };
  ips: { total: number; active: number; high_severity: number };
  reports: { total: number; today: number; this_week: number; this_month: number };
}

export const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    domains: { total: 0, active: 0, high_severity: 0 },
    numbers: { total: 0, active: 0, high_severity: 0 },
    ips: { total: 0, active: 0, high_severity: 0 },
    reports: { total: 0, today: 0, this_week: 0, this_month: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const loadStatistics = async () => {
    try {
      const newStats: AdminStats = {
        domains: { total: 0, active: 0, high_severity: 0 },
        numbers: { total: 0, active: 0, high_severity: 0 },
        ips: { total: 0, active: 0, high_severity: 0 },
        reports: { total: 0, today: 0, this_week: 0, this_month: 0 },
      };

      // Get domain statistics
      const { data: domains, error: domainsError } = await supabase
        .from('fraud_domains')
        .select('*');

      if (!domainsError && domains) {
        newStats.domains.total = domains.length;
        newStats.domains.active = domains.filter(d => d.active).length;
        newStats.domains.high_severity = domains.filter(d => d.severity >= 80).length;
      }

      // Get phone number statistics
      const { data: numbers, error: numbersError } = await supabase
        .from('fraud_numbers')
        .select('*');

      if (!numbersError && numbers) {
        newStats.numbers.total = numbers.length;
        newStats.numbers.active = numbers.filter(n => n.active).length;
        newStats.numbers.high_severity = numbers.filter(n => n.severity >= 80).length;
      }

      // Get IP statistics
      const { data: ips, error: ipsError } = await supabase
        .from('fraud_ips')
        .select('*');

      if (!ipsError && ips) {
        newStats.ips.total = ips.length;
        newStats.ips.active = ips.filter(i => i.active).length;
        newStats.ips.high_severity = ips.filter(i => i.severity >= 80).length;
      }

      // Get report statistics
      const { data: reports, error: reportsError } = await supabase
        .from('proxy_reports')
        .select('*');

      if (!reportsError && reports) {
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const weekStart = now - (7 * 24 * 60 * 60 * 1000);
        const monthStart = now - (30 * 24 * 60 * 60 * 1000);

        newStats.reports.total = reports.length;
        newStats.reports.today = reports.filter(r => r.timestamp >= todayStart).length;
        newStats.reports.this_week = reports.filter(r => r.timestamp >= weekStart).length;
        newStats.reports.this_month = reports.filter(r => r.timestamp >= monthStart).length;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
  }> = ({ title, value, subtitle, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={styles.statCardTitle}>{title}</Text>
        </View>
        <Text style={[styles.statCardValue, { color }]}>{value}</Text>
        <Text style={styles.statCardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {user?.email}</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Threat Statistics</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Domains"
              value={stats.domains.total}
              subtitle={`${stats.domains.active} active, ${stats.domains.high_severity} high risk`}
              icon="globe"
              color="#3B82F6"
            />
            
            <StatCard
              title="Phone Numbers"
              value={stats.numbers.total}
              subtitle={`${stats.numbers.active} active, ${stats.numbers.high_severity} high risk`}
              icon="call"
              color="#10B981"
            />
            
            <StatCard
              title="IP Addresses"
              value={stats.ips.total}
              subtitle={`${stats.ips.active} active, ${stats.ips.high_severity} high risk`}
              icon="server"
              color="#F59E0B"
            />
            
            <StatCard
              title="Reports Today"
              value={stats.reports.today}
              subtitle={`${stats.reports.this_week} this week, ${stats.reports.total} total`}
              icon="flag"
              color="#EF4444"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Manage Threats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="flag" size={32} color="#10B981" />
              <Text style={styles.actionButtonText}>Review Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle" size={32} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Add Threat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings" size={32} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              🚨 {stats.domains.high_severity} high-severity threats detected
            </Text>
            <Text style={styles.activityText}>
              📊 {stats.reports.today} reports received today
            </Text>
            <Text style={styles.activityText}>
              ✅ {stats.domains.active + stats.numbers.active + stats.ips.active} active threats monitored
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 60) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    flex: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
});
