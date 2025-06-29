import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  variant?: 'default' | 'gradient';
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showSettings = false,
  onSettingsPress,
  showBack = false,
  onBack,
  variant = 'default'
}) => {
  const headerContent = (
    <View style={styles.content}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="arrow-back" 
            size={Platform.OS === 'web' ? 24 : 22} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
      )}
      
      <View style={[styles.titleContainer, showBack && styles.titleContainerWithBack]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {showSettings && (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onSettingsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="settings-outline" 
            size={Platform.OS === 'web' ? 24 : 22} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={variant === 'gradient' ? theme.colors.gradients.primary[0] : theme.colors.background.primary}
        translucent={Platform.OS === 'android'}
      />
      <SafeAreaView style={styles.safeArea}>
        {variant === 'gradient' ? (
          <LinearGradient
            colors={[theme.colors.gradients.ocean[0], theme.colors.gradients.ocean[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            {headerContent}
          </LinearGradient>
        ) : (
          <View style={styles.header}>
            {headerContent}
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background.primary,
  },
  
  header: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    ...theme.shadows.small,
  },
  
  gradientHeader: {
    ...theme.shadows.medium,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.md,
    paddingVertical: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.sm,
    minHeight: Platform.OS === 'web' ? 70 : 60,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 + theme.spacing.sm : theme.spacing.sm,
  },
  
  titleContainer: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  
  title: {
    fontSize: Platform.OS === 'web' ? theme.typography.sizes.xl : theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text.primary,
    lineHeight: Platform.OS === 'web' ? 28 : 24,
  },
  
  subtitle: {
    fontSize: Platform.OS === 'web' ? theme.typography.sizes.sm : theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    opacity: 0.9,
  },
  
  settingsButton: {
    width: Platform.OS === 'web' ? 44 : 40,
    height: Platform.OS === 'web' ? 44 : 40,
    borderRadius: Platform.OS === 'web' ? 22 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  backButton: {
    width: Platform.OS === 'web' ? 44 : 40,
    height: Platform.OS === 'web' ? 44 : 40,
    borderRadius: Platform.OS === 'web' ? 22 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: theme.spacing.md,
  },
  
  titleContainerWithBack: {
    paddingLeft: 0,
  },
});

