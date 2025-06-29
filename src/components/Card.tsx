import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
  variant?: 'default' | 'glass' | 'gradient';
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'lg',
  variant = 'default',
  pressable = false,
  onPress,
}) => {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    if (pressable) {
      Animated.spring(animatedValue, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const cardContent = (
    <View style={[
      styles.card, 
      variant === 'glass' && styles.glassCard,
      { padding: theme.spacing[padding] },
      style
    ]}>
      {children}
    </View>
  );

  const animatedCard = (
    <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
      {variant === 'gradient' ? (
        <LinearGradient
          colors={[theme.colors.gradients.dark[0], theme.colors.gradients.dark[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientCard, { padding: theme.spacing[padding] }, style]}
        >
          {children}
        </LinearGradient>
      ) : (
        cardContent
      )}
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {animatedCard}
      </TouchableOpacity>
    );
  }

  return animatedCard;
};

interface StatusCardProps {
  title: string;
  status: 'active' | 'inactive' | 'warning';
  description?: string;
  onUpgrade?: () => void;
  stats?: {
    label: string;
    value: string | number;
  }[];
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  description,
  onUpgrade,
  stats,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: theme.colors.success,
          text: 'Premium Protection Active',
          gradient: theme.colors.gradients.success,
          icon: '🛡️',
        };
      case 'warning':
        return {
          color: theme.colors.warning,
          text: 'Limited Protection',
          gradient: [theme.colors.warning, '#fbbf24'] as [string, string],
          icon: '⚠️',
        };
      case 'inactive':
        return {
          color: theme.colors.danger,
          text: 'Basic Protection',
          gradient: theme.colors.gradients.danger,
          icon: '🔓',
        };
      default:
        return {
          color: theme.colors.text.secondary,
          text: 'Unknown Status',
          gradient: theme.colors.gradients.dark,
          icon: '❓',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card style={styles.statusCard} variant="glass">
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>{title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
        </View>
      </View>
      
      <View style={styles.statusIndicator}>
        <LinearGradient
          colors={statusConfig.gradient[0] && statusConfig.gradient[1] ? [statusConfig.gradient[0], statusConfig.gradient[1]] : ['#000', '#000']}
          style={styles.statusDot}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.statusText}>{statusConfig.text}</Text>
      </View>
      
      {description && (
        <Text style={styles.statusDescription}>{description}</Text>
      )}

      {stats && stats.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}
      
      {status !== 'active' && onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <LinearGradient
            colors={[theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]]}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.upgradeButtonText}>✨ Upgrade to Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.medium,
  },
  
  glassCard: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.border.secondary,
  },
  
  gradientCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    ...theme.shadows.large,
  },
  
  statusCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  statusTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statusIcon: {
    fontSize: 16,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  
  statusText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  statusDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  
  upgradeButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  
  upgradeGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  upgradeButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
  },
});

