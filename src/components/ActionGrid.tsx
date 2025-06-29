import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { theme } from '../theme';

interface ActionButtonProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  color: string;
  icon: string;
  gradient?: boolean;
  disabled?: boolean;
  style?: 'traditional' | 'cyber' | 'premium';
}

interface ActionGridProps {
  actions: ActionButtonProps[];
  numColumns?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  subtitle,
  onPress,
  color,
  icon,
  gradient = true,
  disabled = false,
  style = 'traditional',
}) => {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getGradientColors = (): [string, string] => {
    if (color === theme.colors.primary) {
      return [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]];
    } else if (color === theme.colors.secondary) {
      return [theme.colors.gradients.secondary[0], theme.colors.gradients.secondary[1]];
    } else if (color === theme.colors.success) {
      return [theme.colors.gradients.success[0], theme.colors.gradients.success[1]];
    } else if (color === theme.colors.danger) {
      return [theme.colors.gradients.danger[0], theme.colors.gradients.danger[1]];
    } else if (color === theme.colors.warning) {
      return [theme.colors.gradients.golden[0], theme.colors.gradients.golden[1]];
    } else {
      return [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]];
    }
  };

  const getStyleVariant = () => {
    switch (style) {
      case 'cyber':
        return styles.cyberCard;
      case 'premium':
        return styles.premiumCard;
      default:
        return styles.traditionalCard;
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.actionButton,
          getStyleVariant(),
          { transform: [{ scale: animatedValue }] },
          disabled && styles.disabledButton,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.buttonIcon}>{icon}</Text>
                {style === 'traditional' && <View style={styles.mandalaPattern} />}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>{title}</Text>
                {subtitle && <Text style={styles.buttonSubtitle}>{subtitle}</Text>}
              </View>
              {style === 'cyber' && <View style={styles.cyberGlow} />}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.flatBackground, { backgroundColor: color }]}>
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.buttonIcon}>{icon}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>{title}</Text>
                {subtitle && <Text style={styles.buttonSubtitle}>{subtitle}</Text>}
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export const ActionGrid: React.FC<ActionGridProps> = ({ 
  actions, 
  numColumns = 2 
}) => {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>🛡️ Cyber Arsenal</Text>
        <Text style={styles.gridSubtitle}>Advanced security tools</Text>
      </View>
      
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <View key={index} style={[
            styles.gridItem, 
            { width: `${100 / numColumns - 2}%` }
          ]}>
            <ActionButton {...action} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    marginVertical: theme.spacing.md,
  },

  gridHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },

  gridTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  gridSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },

  gridItem: {
    marginBottom: theme.spacing.md,
  },

  actionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },

  traditionalCard: {
    borderWidth: 2,
    borderColor: theme.colors.border.accent,
    ...theme.shadows.glow,
  },

  cyberCard: {
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.cyber,
  },

  premiumCard: {
    borderWidth: 2,
    borderColor: theme.colors.text.gold,
    ...theme.shadows.colored,
  },

  disabledButton: {
    opacity: 0.5,
  },

  gradientBackground: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
  },

  flatBackground: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
  },

  buttonContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    position: 'relative',
  },

  iconContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    fontSize: 36,
    textAlign: 'center',
    zIndex: 2,
  },

  mandalaPattern: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.border.glow,
    opacity: 0.3,
    borderStyle: 'dashed',
  },

  cyberGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.gradients.cyber[0],
    opacity: 0.1,
    borderRadius: theme.borderRadius.lg,
  },

  textContainer: {
    alignItems: 'center',
  },

  buttonTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  buttonSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

