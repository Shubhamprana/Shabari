/**
 * Admin Access Button Component
 * Button to access admin panel from settings or other screens
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminAuth } from '../utils/AdminAuth';

interface AdminAccessButtonProps {
  onPress: () => void;
  style?: any;
}

export const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({
  onPress,
  style,
}) => {
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

  const handlePress = () => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'You do not have admin privileges. Contact your administrator for access.',
        [{ text: 'OK' }]
      );
      return;
    }

    onPress();
  };

  if (loading) {
    return (
      <TouchableOpacity style={[styles.container, style]} disabled>
        <View style={styles.content}>
          <Ionicons name="shield-outline" size={24} color="#94A3B8" />
          <Text style={styles.text}>Checking access...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!isAdmin) {
    return null; // Don't show the button if user is not admin
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons name="shield" size={24} color="#3B82F6" />
        <View style={styles.textContainer}>
          <Text style={styles.text}>Admin Panel</Text>
          <Text style={styles.subtext}>Manage threats and reports</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
});
