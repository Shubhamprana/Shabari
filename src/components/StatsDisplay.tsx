import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface Stat {
  totalScans: number;
  threatsBlocked: number;
  filesScanned: number;
}

interface StatsDisplayProps {
  stats: Stat;
  animated?: boolean;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  stats, 
  animated = true 
}) => {
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (animated) {
      const animations = animatedValues.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 800,
          delay: index * 200,
          useNativeDriver: true,
        })
      );

      Animated.stagger(100, animations).start();
    }
  }, [animated, animatedValues]);

  const statItems = [
    {
      label: 'Total Scans',
      value: stats.totalScans.toLocaleString(),
      color: [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]] as const,
      icon: '🔍',
    },
    {
      label: 'Threats Blocked',
      value: stats.threatsBlocked.toLocaleString(),
      color: [theme.colors.gradients.danger[0], theme.colors.gradients.danger[1]] as const,
      icon: '🛡️',
    },
    {
      label: 'Files Scanned',
      value: stats.filesScanned.toLocaleString(),
      color: [theme.colors.gradients.success[0], theme.colors.gradients.success[1]] as const,
      icon: '📁',
    },
  ];

  return (
    <View style={styles.container}>
      {statItems.map((item, index) => (
        <Animated.View
          key={index}
          style={[
            styles.statCard,
            animated && {
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={item.color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.xs,
    marginBottom: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.md,
    gap: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.xs,
  },
  
  statCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  
  gradient: {
    padding: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'web' ? 120 : 100,
  },
  
  iconContainer: {
    width: Platform.OS === 'web' ? 40 : 32,
    height: Platform.OS === 'web' ? 40 : 32,
    borderRadius: Platform.OS === 'web' ? 20 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? theme.spacing.sm : theme.spacing.xs,
  },
  
  icon: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
  },
  
  value: {
    fontSize: Platform.OS === 'web' ? theme.typography.sizes.xl : theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: Platform.OS === 'web' ? theme.spacing.xs : 2,
  },
  
  label: {
    fontSize: Platform.OS === 'web' ? theme.typography.sizes.xs : 11,
    color: theme.colors.text.primary,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 16 : 14,
  },
});

