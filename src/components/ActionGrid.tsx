import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Define the specific screens the navigator can go to
type ScreenName = 
  | 'SMSScanner'
  | 'SecureBrowser'
  | 'Quarantine'
  | 'LiveQRScanner'
  | 'FeatureManagement'; // A catch-all for premium/other features

// Ensure the props for each button are strictly typed
export interface ActionButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  screen?: ScreenName;
  description: string;
  isPremium?: boolean; // Optional flag for premium features
  isComingSoon?: boolean; // New flag for preview features
  onPress?: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  screen,
  description,
  isPremium = false,
  isComingSoon = false,
  onPress,
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
    if (isComingSoon) {
      return ['#FF6B6B', '#FF8E8E']; // Attractive coral gradient for coming soon
    } else if (isPremium) {
      return [theme.colors.gradients.golden[0], theme.colors.gradients.golden[1]];
    } else {
      return [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]];
    }
  };

  const getStyleVariant = () => {
    if (isComingSoon) {
      return styles.comingSoonCard;
    } else if (isPremium) {
      return styles.premiumCard;
    } else {
      return styles.traditionalCard;
    }
  };

  const getIconColor = () => {
    if (isComingSoon) {
      return '#FFFFFF';
    } else if (isPremium) {
      return theme.colors.text.primary;
    } else {
      return theme.colors.primary;
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.actionButton,
          getStyleVariant(),
          { transform: [{ scale: animatedValue }] },
          isComingSoon && { opacity: 0.95 }, // Make coming soon items slightly transparent
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={isComingSoon ? ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'] : (isPremium ? ['#FFD700', '#FFA500'] : ['#FFFFFF', '#E0E0E0'])}
                style={styles.iconBackground}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={36}
                  color={getIconColor()}
                />
              </LinearGradient>
              {isPremium && <View style={styles.mandalaPattern} />}
              {isComingSoon && (
                <View style={styles.comingSoonBadge}>
                  <MaterialCommunityIcons name="rocket-launch" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={[
                styles.buttonTitle,
                isComingSoon && styles.comingSoonTitle
              ]}>
                {label}
              </Text>
              <Text style={[
                styles.buttonSubtitle,
                isComingSoon && styles.comingSoonSubtitle
              ]}>
                {description}
              </Text>
            </View>
            {isPremium && <View style={styles.cyberGlow} />}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

interface ActionGridProps {
  actions: ActionButtonProps[];
  numColumns?: number;
  title?: string;
  subtitle?: string;
}

// Core actions that are always available (for preview mode)
const coreActions: ActionButtonProps[] = [
  {
    icon: 'file-document-outline',
    label: 'Document Scanner',
    screen: 'Quarantine',
    description: 'AI-powered threat detection',
  },
  {
    icon: 'link-variant',
    label: 'Link Detection',
    screen: 'SecureBrowser',
    description: 'Real-time URL protection',
  },
  {
    icon: 'qrcode-scan',
    label: 'QR Scanner',
    screen: 'LiveQRScanner',
    description: 'Live fraud detection',
  },
];

// Actions that are "Coming Soon" for non-premium users
const previewActions: ActionButtonProps[] = [
  {
    icon: 'message-text-outline',
    label: 'SMS Shield',
    screen: 'SMSScanner',
    description: 'Coming Soon - Enhanced Protection',
    isComingSoon: true,
  },
  {
    icon: 'web',
    label: 'Secure Browser',
    screen: 'SecureBrowser',
    description: 'Coming Soon - Safe Browsing',
    isComingSoon: true,
  },
  {
    icon: 'robot-outline',
    label: 'AI Guardian',
    screen: 'FeatureManagement',
    description: 'Coming Soon - Smart Defense',
    isComingSoon: true,
  },
];

export const ActionGrid: React.FC<ActionGridProps> = ({ 
  actions, 
  numColumns = 2,
  title = "🛡️ Security Tools",
  subtitle = "Advanced protection suite"
}) => {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>{title}</Text>
        <Text style={styles.gridSubtitle}>{subtitle}</Text>
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

export { coreActions, previewActions };

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

  premiumCard: {
    borderWidth: 2,
    borderColor: theme.colors.text.gold,
    ...theme.shadows.colored,
  },

  gradientBackground: {
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

  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
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

  comingSoonCard: {
    borderWidth: 2,
    borderColor: theme.colors.border.accent,
    ...theme.shadows.glow,
  },

  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  comingSoonTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  comingSoonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

