import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  gradient?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  gradient = true,
  icon,
  fullWidth = false,
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
    switch (variant) {
      case 'primary':
        return [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]];
      case 'secondary':
        return [theme.colors.gradients.secondary[0], theme.colors.gradients.secondary[1]];
      case 'danger':
        return [theme.colors.gradients.danger[0], theme.colors.gradients.danger[1]];
      case 'success':
        return [theme.colors.gradients.success[0], theme.colors.gradients.success[1]];
      default:
        return [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]];
    }
  };

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    // Add size styles
    if (size === 'small') baseStyle.push(styles.small);
    if (size === 'medium') baseStyle.push(styles.medium);
    if (size === 'large') baseStyle.push(styles.large);
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (!gradient) {
      if (variant === 'outline') baseStyle.push(styles.outline);
      if (variant === 'ghost') baseStyle.push(styles.ghost);
      if (variant === 'secondary') baseStyle.push(styles.secondary);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];
    
    // Add size text styles
    if (size === 'small') baseStyle.push(styles.smallText);
    if (size === 'medium') baseStyle.push(styles.mediumText);
    if (size === 'large') baseStyle.push(styles.largeText);
    
    if (variant === 'outline' || variant === 'ghost') {
      baseStyle.push(styles.outlineText);
    }
    
    return baseStyle;
  };

  const ButtonContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={theme.colors.text.primary} 
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </View>
  );

  if (gradient && variant !== 'outline' && variant !== 'ghost' && variant !== 'secondary') {
    return (
      <Animated.View 
        style={[
          { transform: [{ scale: animatedValue }] },
          style
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
          style={getButtonStyle()}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <ButtonContent />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: animatedValue }] },
        style
      ]}
    >
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <ButtonContent />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.medium,
  },
  
  gradient: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Sizes
  small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 52,
  },
  
  // Variants
  secondary: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  disabled: {
    opacity: 0.6,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  smallText: {
    fontSize: theme.typography.sizes.sm,
  },
  mediumText: {
    fontSize: theme.typography.sizes.md,
  },
  largeText: {
    fontSize: theme.typography.sizes.lg,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  
  icon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
});

