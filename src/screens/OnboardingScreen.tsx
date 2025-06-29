import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: [string, string];
  pattern: 'mandala' | 'paisley' | 'hexagon';
}

const onboardingData: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🇮🇳',
    title: 'शबरी में आपका स्वागत है',
    subtitle: 'Welcome to Shabari',
    description: 'Advanced Indian cybersecurity powered by traditional wisdom and modern technology. Your digital guardian protecting with the strength of ancient values.',
    gradient: [theme.colors.gradients.tricolor[0], theme.colors.gradients.tricolor[2]],
    pattern: 'mandala',
  },
  {
    id: '2',
    emoji: '🛡️',
    title: 'साइबर रक्षा',
    subtitle: 'Cyber Defense',
    description: 'Real-time threat detection using AI and ML algorithms. Protect your files, messages, and digital life with enterprise-grade security.',
    gradient: [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]],
    pattern: 'hexagon',
  },
  {
    id: '3',
    emoji: '🔮',
    title: 'स्मार्ट संरक्षण',
    subtitle: 'Smart Protection',
    description: 'Intelligent scanning for QR codes, SMS, files, and links. Machine learning adapts to new threats while preserving your privacy.',
    gradient: [theme.colors.gradients.cyber[0], theme.colors.gradients.cyber[1]],
    pattern: 'paisley',
  },
  {
    id: '4',
    emoji: '🚀',
    title: 'तैयार हैं?',
    subtitle: 'Ready to Begin?',
    description: 'Join millions of users who trust Shabari for comprehensive digital protection. Start your secure journey now.',
    gradient: [theme.colors.gradients.golden[0], theme.colors.gradients.golden[1]],
    pattern: 'mandala',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const pagerRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const slideAnim = useSharedValue(0);

  const handleNextPress = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      pagerRef.current?.scrollTo({ x: nextPage * width, y: 0, animated: true });
      slideAnim.value = withSpring(nextPage);
    } else {
      onComplete();
    }
  };

  const handlePrevPress = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      pagerRef.current?.scrollTo({ x: prevPage * width, y: 0, animated: true });
      slideAnim.value = withSpring(prevPage);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const page = Math.round(scrollX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      slideAnim.value = withSpring(page);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderPattern = (pattern: string) => {
    switch (pattern) {
      case 'mandala':
        return <View style={styles.mandalaPattern} />;
      case 'paisley':
        return <View style={styles.paisleyPattern} />;
      case 'hexagon':
        return <View style={styles.hexagonPattern} />;
      default:
        return null;
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        slideAnim.value,
        [index - 1, index, index + 1],
        [0.3, 1, 0.3],
        Extrapolate.CLAMP
      );
      
      const scale = interpolate(
        slideAnim.value,
        [index - 1, index, index + 1],
        [0.8, 1, 0.8],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [{ scale }],
      };
    });

    return (
      <View key={slide.id} style={styles.slide}>
        <LinearGradient
          colors={slide.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slideGradient}
        >
          {renderPattern(slide.pattern)}
          
          <Animated.View style={[styles.slideContent, animatedStyle]}>
            <View style={styles.emojiContainer}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
              <View style={styles.emojiGlow} />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderPaginationDot = (index: number) => {
    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        slideAnim.value,
        [index - 1, index, index + 1],
        [1, 1.5, 1],
        Extrapolate.CLAMP
      );
      
      const opacity = interpolate(
        slideAnim.value,
        [index - 1, index, index + 1],
        [0.4, 1, 0.4],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.paginationDot,
          currentPage === index && styles.activeDot,
          animatedStyle,
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>शबरी</Text>
          <Text style={styles.logoSubtext}>Shabari</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pagerView}
        onScroll={handleScroll}
      >
        {onboardingData.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => renderPaginationDot(index))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={handlePrevPress}
            style={[styles.navButton, styles.prevButton]}
            disabled={currentPage === 0}
          >
            <LinearGradient
              colors={currentPage === 0 ? 
                [theme.colors.surface.secondary, theme.colors.surface.tertiary] :
                [theme.colors.gradients.secondary[0], theme.colors.gradients.secondary[1]]
              }
              style={styles.navButtonGradient}
            >
              <Text style={[styles.navButtonText, currentPage === 0 && styles.disabledText]}>
                ← Previous
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextPress}
            style={[styles.navButton, styles.nextButton]}
          >
            <LinearGradient
              colors={currentPage === onboardingData.length - 1 ?
                [theme.colors.gradients.golden[0], theme.colors.gradients.golden[1]] :
                [theme.colors.gradients.primary[0], theme.colors.gradients.primary[1]]
              }
              style={styles.navButtonGradient}
            >
              <Text style={styles.navButtonText}>
                {currentPage === onboardingData.length - 1 ? 'Get Started 🚀' : 'Next →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  skipButton: {
    padding: theme.spacing.sm,
  },

  skipText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },

  logoContainer: {
    alignItems: 'center',
  },

  logoText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  logoSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  placeholder: {
    width: 60,
  },

  pagerView: {
    flex: 1,
  },

  slide: {
    width: width,
    flex: 1,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    ...theme.shadows.large,
  },

  slideGradient: {
    flex: 1,
    position: 'relative',
  },

  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    zIndex: 2,
  },

  emojiContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slideEmoji: {
    fontSize: 100,
    textAlign: 'center',
    zIndex: 2,
  },

  emojiGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },

  textContainer: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },

  slideTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },

  slideSubtitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  slideDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },

  // Pattern styles
  mandalaPattern: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
    borderStyle: 'dashed',
    zIndex: 1,
  },

  paisleyPattern: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '15%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.xxl,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },

  hexagonPattern: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    right: '20%',
    bottom: '25%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.hexagon,
    zIndex: 1,
  },

  bottomContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },

  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.tertiary,
  },

  activeDot: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.glow,
  },

  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },

  navButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },

  prevButton: {
    opacity: 1,
  },

  nextButton: {
    // Enhanced styling for next button
  },

  navButtonGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  disabledText: {
    opacity: 0.5,
  },
});

export default OnboardingScreen;

