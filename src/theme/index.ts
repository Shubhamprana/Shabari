import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    // Indian-inspired cybersecurity colors
    primary: '#FF4500', // Saffron/Bhagwa - Traditional Indian saffron
    primaryLight: '#FF6B35', // Light saffron
    primaryDark: '#CC3700', // Dark saffron
    secondary: '#138808', // Indian green (flag green)
    secondaryLight: '#4CAF50',
    accent: '#000080', // Navy blue (flag blue)
    success: '#2E7D32', // Dharmic green
    warning: '#FF8F00', // Turmeric yellow
    danger: '#D32F2F', // Sindoor red
    info: '#1976D2', // Krishna blue
    
    // Indian-inspired gradients with cyber elements
    gradients: {
      primary: ['#FF4500', '#FF6B35'], // Saffron gradient
      secondary: ['#138808', '#4CAF50'], // Green gradient
      danger: ['#D32F2F', '#FF5722'], // Red gradient
      success: ['#2E7D32', '#4CAF50'], // Green success
      dark: ['#0D1421', '#1A1F2E'], // Dark cyber
      accent: ['#000080', '#3F51B5'], // Blue gradient
      tricolor: ['#FF4500', '#FFFFFF', '#138808'], // Indian flag
      sunset: ['#FF4500', '#FF8F00'], // Indian sunset
      ocean: ['#000080', '#138808'], // Navy to green
      royal: ['#4A148C', '#7B1FA2'], // Royal purple
      golden: ['#FF8F00', '#FFC107'], // Golden temple
      cyber: ['#00BCD4', '#009688'], // Cyber teal
    },
    
    // Dark theme with Indian warmth
    background: {
      primary: '#0D1421', // Deep space blue
      secondary: '#1A1F2E', // Dark slate
      tertiary: '#2D3748', // Medium dark
      card: '#1A1F2E',
      modal: 'rgba(13, 20, 33, 0.95)',
      pattern: 'rgba(255, 69, 0, 0.05)', // Subtle saffron pattern
    },
    
    surface: {
      primary: '#1A1F2E', // Main surface
      secondary: '#2D3748', // Secondary surface
      tertiary: '#4A5568', // Light surface
      glass: 'rgba(26, 31, 46, 0.8)', // Glass effect
    },
    
    text: {
      primary: '#FFFFFF', // Pure white
      secondary: '#E2E8F0', // Light gray
      tertiary: '#A0AEC0', // Medium gray
      inverse: '#0D1421',
      muted: '#718096', // Muted gray
      accent: '#FF4500', // Saffron accent
      gold: '#FFD700', // Golden text
      silver: '#C0C0C0', // Silver text
    },
    
    border: {
      primary: 'rgba(226, 232, 240, 0.1)', // Subtle border
      secondary: 'rgba(226, 232, 240, 0.05)', // Very subtle
      focus: '#FF4500', // Saffron focus
      accent: 'rgba(255, 69, 0, 0.3)', // Saffron accent border
      glow: 'rgba(255, 69, 0, 0.5)', // Saffron glow
    },
    
    overlay: 'rgba(13, 20, 33, 0.9)',
    glass: 'rgba(26, 31, 46, 0.8)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    round: 50,
    full: 9999,
    hexagon: 8, // For hexagonal Indian patterns
  },
  
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      display: 48,
      hero: 64,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fonts: {
      // Support for Devanagari if needed
      primary: 'System',
      devanagari: 'Noto Sans Devanagari',
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    colored: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    cyber: {
      shadowColor: '#00BCD4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  patterns: {
    // Indian geometric patterns
    mandala: {
      strokeWidth: 1,
      opacity: 0.1,
      color: '#FF4500',
    },
    paisley: {
      strokeWidth: 1,
      opacity: 0.08,
      color: '#138808',
    },
    hexagon: {
      strokeWidth: 1.5,
      opacity: 0.12,
      color: '#000080',
    },
  },
  
  animations: {
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
      cyber: 150, // Quick cyber-like animations
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  layout: {
    window: { width, height },
    isSmallDevice: width < 375,
    isLargeDevice: width > 414,
    headerHeight: 80, // Taller for Indian aesthetic
    tabBarHeight: 90,
    cardSpacing: 12,
    gridSpacing: 16,
  },
};

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  shadow: theme.shadows.small,
  
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.medium,
  },
  
  glassmorphism: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    backdropFilter: 'blur(10px)',
  },
  
  indianCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.accent,
    ...theme.shadows.glow,
    position: 'relative',
  },
  
  cyberCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.cyber,
    position: 'relative',
  },
};

