/**
 * Admin Navigation Component
 * Provides navigation for admin screens
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AdminNavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const navigationItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'grid-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'grid' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'threats',
      title: 'Threats',
      icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'shield' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'flag-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'flag' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'settings' as keyof typeof Ionicons.glyphMap,
    },
  ];

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onNavigate(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={24}
              color={isActive ? '#3B82F6' : '#64748B'}
            />
            <Text style={[
              styles.navText,
              isActive && styles.navTextActive
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  navTextActive: {
    color: '#3B82F6',
  },
});
