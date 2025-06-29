import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Header } from '../components/Header';
import { YaraSecurityService } from '../services/YaraSecurityService';
import { PREMIUM_FEATURES, PremiumFeature, useFeaturePermissionStore } from '../stores/featurePermissionStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { theme } from '../theme';

interface FeatureManagementScreenProps {
  onNavigateBack: () => void;
}

export const FeatureManagementScreen: React.FC<FeatureManagementScreenProps> = ({
  onNavigateBack
}) => {
  const { isPremium } = useSubscriptionStore();
  const {
    enabledFeatures,
    batteryOptimizationMode,
    dataUsageMode,
    isInitialized,
    isLoading,
    initializeFeaturePermissions,
    toggleFeature,
    updateBatteryMode,
    updateDataUsageMode,
    getFeatureStatus,
    resetToDefaults,
    exportSettings,
    importSettings
  } = useFeaturePermissionStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    protection: true,
    monitoring: true,
    analysis: true,
    automation: true
  });

  const [yaraStatus, setYaraStatus] = useState<{
    available: boolean;
    initialized: boolean;
    native: boolean;
    version: string;
    rulesCount: number;
  } | null>(null);

  useEffect(() => {
    if (isPremium && !isInitialized) {
      initializeFeaturePermissions();
    }
    
    // Load YARA status
    loadYaraStatus();
  }, [isPremium, isInitialized]);

  const loadYaraStatus = async () => {
    try {
      const status = await YaraSecurityService.getEngineStatus();
      setYaraStatus(status);
    } catch (error) {
      console.error('Failed to load YARA status:', error);
      setYaraStatus({
        available: false,
        initialized: false,
        native: false,
        version: 'Unknown',
        rulesCount: 0
      });
    }
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Header title="Feature Management" showBack={true} onBack={onNavigateBack} />
        <View style={styles.notPremiumContainer}>
          <Text style={styles.notPremiumIcon}>🔒</Text>
          <Text style={styles.notPremiumTitle}>Premium Feature</Text>
          <Text style={styles.notPremiumText}>
            Feature management is available for Premium users only. 
            Upgrade to get granular control over your security features.
          </Text>
        </View>
      </View>
    );
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleFeatureToggle = async (featureId: string) => {
    const success = await toggleFeature(featureId);
    if (!success) {
      Alert.alert(
        '❌ Feature Toggle Failed',
        'Unable to toggle this feature. Please check permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportSettings = async () => {
    try {
      const settings = exportSettings();
      
      if (Platform.OS === 'web') {
        // For web, copy to clipboard or download
        navigator.clipboard?.writeText(settings);
        Alert.alert('✅ Settings Exported', 'Settings copied to clipboard!');
      } else {
        // For mobile, use share
        await Share.share({
          message: settings,
          title: 'Shabari Feature Settings'
        });
      }
    } catch (error) {
      Alert.alert('❌ Export Failed', 'Unable to export settings.');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      '🔄 Reset Feature Settings',
      'This will reset all feature preferences to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('✅ Settings Reset', 'All feature settings have been reset to defaults.');
          }
        }
      ]
    );
  };

  const getFeaturesByCategory = (category: string) => {
    return PREMIUM_FEATURES.filter(feature => feature.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protection': return '🛡️';
      case 'monitoring': return '👁️';
      case 'analysis': return '🧠';
      case 'automation': return '⚡';
      default: return '🔧';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'protection': return 'Protection Services';
      case 'monitoring': return 'Monitoring Services';
      case 'analysis': return 'Analysis Services';
      case 'automation': return 'Automation Services';
      default: return 'Other Services';
    }
  };

  const getBatteryImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.danger;
      default: return theme.colors.text.secondary;
    }
  };

  const getDataUsageColor = (usage: string) => {
    switch (usage) {
      case 'none': return theme.colors.success;
      case 'low': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.danger;
      default: return theme.colors.text.secondary;
    }
  };

  const renderFeatureItem = (feature: PremiumFeature) => {
    const status = getFeatureStatus(feature.id);
    
    return (
      <View key={feature.id} style={styles.featureItem}>
        <View style={styles.featureHeader}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureDetails}>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
          <Switch
            value={status.isEnabled}
            onValueChange={() => handleFeatureToggle(feature.id)}
            disabled={!status.canEnable && !status.isEnabled}
            trackColor={{
              false: theme.colors.surface.secondary,
              true: theme.colors.primary
            }}
            thumbColor={status.isEnabled ? theme.colors.background.primary : theme.colors.text.secondary}
          />
        </View>
        
        <View style={styles.featureMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Battery</Text>
            <Text style={[styles.metricValue, { color: getBatteryImpactColor(feature.batteryImpact) }]}>
              {feature.batteryImpact.toUpperCase()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Data</Text>
            <Text style={[styles.metricValue, { color: getDataUsageColor(feature.dataUsage) }]}>
              {feature.dataUsage.toUpperCase()}
            </Text>
          </View>
          {feature.isSystemCritical && (
            <View style={styles.metric}>
              <Text style={styles.criticalBadge}>CRITICAL</Text>
            </View>
          )}
          {!status.hasPermissions && status.canEnable && (
            <View style={styles.metric}>
              <Text style={styles.permissionBadge}>NEEDS PERMISSION</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCategorySection = (category: string) => {
    const features = getFeaturesByCategory(category);
    const isExpanded = expandedCategories[category];
    
    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
        >
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
            <Text style={styles.categoryTitle}>{getCategoryTitle(category)}</Text>
            <Text style={styles.categoryCount}>({features.length})</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.categoryContent}>
            {features.map(renderFeatureItem)}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Feature Management" showBack={true} onBack={onNavigateBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading feature settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Feature Management" showBack={true} onBack={onNavigateBack} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Section */}
        <View style={styles.overviewSection}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.overviewCard}
          >
            <Text style={styles.overviewTitle}>Premium Feature Control</Text>
            <Text style={styles.overviewSubtitle}>
              Manage which security features are active on your device
            </Text>
            <View style={styles.overviewStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {Object.values(enabledFeatures).filter(Boolean).length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{PREMIUM_FEATURES.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Global Settings */}
        <View style={styles.globalSettingsSection}>
          <Text style={styles.sectionTitle}>⚙️ Global Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Battery Optimization</Text>
            <View style={styles.settingOptions}>
              {['performance', 'balanced', 'battery_saver'].map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.settingOption,
                    batteryOptimizationMode === mode && styles.settingOptionActive
                  ]}
                  onPress={() => updateBatteryMode(mode as any)}
                >
                  <Text style={[
                    styles.settingOptionText,
                    batteryOptimizationMode === mode && styles.settingOptionTextActive
                  ]}>
                    {mode.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Usage</Text>
            <View style={styles.settingOptions}>
              {['unlimited', 'limited', 'wifi_only'].map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.settingOption,
                    dataUsageMode === mode && styles.settingOptionActive
                  ]}
                  onPress={() => updateDataUsageMode(mode as any)}
                >
                  <Text style={[
                    styles.settingOptionText,
                    dataUsageMode === mode && styles.settingOptionTextActive
                  ]}>
                    {mode.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* YARA Engine Status */}
        {yaraStatus && (
          <View style={styles.yaraSection}>
            <Text style={styles.sectionTitle}>🛡️ YARA Engine Status</Text>
            <View style={styles.yaraStatusCard}>
              <View style={styles.yaraHeader}>
                <Text style={styles.yaraTitle}>Local Malware Detection</Text>
                <View style={[
                  styles.yaraStatusBadge,
                  { backgroundColor: yaraStatus.available ? theme.colors.success : theme.colors.danger }
                ]}>
                  <Text style={styles.yaraStatusText}>
                    {yaraStatus.available ? '✅ Available' : '❌ Unavailable'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.yaraDetails}>
                <View style={styles.yaraDetailRow}>
                  <Text style={styles.yaraDetailLabel}>Engine Type:</Text>
                  <Text style={styles.yaraDetailValue}>
                    {yaraStatus.native ? 'Native YARA' : 'Mock Engine'}
                  </Text>
                </View>
                
                <View style={styles.yaraDetailRow}>
                  <Text style={styles.yaraDetailLabel}>Version:</Text>
                  <Text style={styles.yaraDetailValue}>{yaraStatus.version}</Text>
                </View>
                
                <View style={styles.yaraDetailRow}>
                  <Text style={styles.yaraDetailLabel}>Detection Rules:</Text>
                  <Text style={styles.yaraDetailValue}>{yaraStatus.rulesCount} rules</Text>
                </View>
                
                <View style={styles.yaraDetailRow}>
                  <Text style={styles.yaraDetailLabel}>Status:</Text>
                  <Text style={[
                    styles.yaraDetailValue,
                    { color: yaraStatus.initialized ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {yaraStatus.initialized ? 'Initialized' : 'Not Initialized'}
                  </Text>
                </View>
              </View>
              
              {!yaraStatus.native && (
                <View style={styles.yaraNote}>
                  <Text style={styles.yaraNoteText}>
                    ℹ️ Currently using mock engine for development. Native YARA engine will be available after building with EAS.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Feature Categories */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🔧 Feature Controls</Text>
          {['protection', 'monitoring', 'analysis', 'automation'].map(renderCategorySection)}
        </View>

        {/* Management Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>🛠️ Management</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleExportSettings}>
            <Text style={styles.actionButtonIcon}>📤</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Export Settings</Text>
              <Text style={styles.actionButtonSubtitle}>Save your feature preferences</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleResetSettings}>
            <Text style={styles.actionButtonIcon}>🔄</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Reset to Defaults</Text>
              <Text style={styles.actionButtonSubtitle}>Restore default feature settings</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ About Feature Management</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>Critical features</Text> are essential for security and cannot be fully disabled{'\n'}
            • <Text style={styles.infoBold}>Battery impact</Text> indicates how much each feature affects battery life{'\n'}
            • <Text style={styles.infoBold}>Data usage</Text> shows network data consumption for each feature{'\n'}
            • Some features require <Text style={styles.infoBold}>system permissions</Text> to function properly
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  content: {
    flex: 1,
  },
  
  notPremiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  
  notPremiumIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  
  notPremiumTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  
  notPremiumText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  
  overviewSection: {
    padding: theme.spacing.md,
  },
  
  overviewCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  
  overviewTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  
  overviewSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  overviewStats: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  
  stat: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: 'bold',
    color: 'white',
  },
  
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  globalSettingsSection: {
    padding: theme.spacing.md,
  },
  
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  
  settingItem: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  settingLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  settingOptions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  
  settingOption: {
    flex: 1,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  
  settingOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  
  settingOptionText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  settingOptionTextActive: {
    color: 'white',
  },
  
  featuresSection: {
    padding: theme.spacing.md,
  },
  
  categorySection: {
    marginBottom: theme.spacing.md,
  },
  
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  categoryIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  
  categoryTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  
  categoryCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  expandIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  
  categoryContent: {
    marginTop: theme.spacing.xs,
  },
  
  featureItem: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  featureIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  
  featureDetails: {
    flex: 1,
  },
  
  featureName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  featureDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  
  featureMetrics: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  metric: {
    alignItems: 'center',
  },
  
  metricLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  
  metricValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
  },
  
  criticalBadge: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
    color: theme.colors.danger,
    backgroundColor: `${theme.colors.danger}20`,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  
  permissionBadge: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
    color: theme.colors.warning,
    backgroundColor: `${theme.colors.warning}20`,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  
  actionsSection: {
    padding: theme.spacing.md,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  actionButtonIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  
  actionButtonContent: {
    flex: 1,
  },
  
  actionButtonTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  actionButtonSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  infoSection: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  
  infoTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  infoBold: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  // YARA Engine Status Styles
  yaraSection: {
    padding: theme.spacing.md,
  },
  
  yaraStatusCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  
  yaraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  
  yaraTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  yaraStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  yaraStatusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: 'white',
  },
  
  yaraDetails: {
    gap: theme.spacing.sm,
  },
  
  yaraDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  yaraDetailLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  yaraDetailValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  yaraNote: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.sm,
  },
  
  yaraNoteText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
}); 