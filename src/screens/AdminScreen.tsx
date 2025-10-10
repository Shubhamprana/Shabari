/**
 * Main Admin Screen
 * Container for all admin functionality with navigation
 */

import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminNavigation } from '../components/AdminNavigation';
import { AdminAuth } from '../utils/AdminAuth';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminReportsScreen } from './AdminReportsScreen';
import { AdminThreatsScreen } from './AdminThreatsScreen';

export const AdminScreen: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await AdminAuth.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <AdminDashboardScreen />;
      case 'threats':
        return <AdminThreatsScreen />;
      case 'reports':
        return <AdminReportsScreen />;
      case 'settings':
        return <AdminSettingsScreen />;
      default:
        return <AdminDashboardScreen />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking admin access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You do not have admin privileges to access this panel.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      <AdminNavigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />
    </SafeAreaView>
  );
};

// Placeholder for settings screen
const AdminSettingsScreen: React.FC = () => {
  return (
    <View style={styles.placeholderContainer}>
      {/* Settings screen placeholder */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
