import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppPermissionInfo, AppPermissionScanResult, PermissionCategory } from '../services/RealAppPermissionAnalyzer';

// ==============================================================================
// COMPONENT PROPS
// ==============================================================================

interface AppPermissionResultsProps {
  scanResult: AppPermissionScanResult;
  onAppAction?: (app: AppPermissionInfo, action: 'view_details' | 'open_settings') => void;
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

const AppPermissionResults: React.FC<AppPermissionResultsProps> = ({ 
  scanResult, 
  onAppAction 
}) => {
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Filter apps based on selected risk level
  const filteredApps = scanResult.riskyApps.filter(app => {
    if (selectedRiskLevel === 'ALL') return true;
    return app.riskLevel === selectedRiskLevel;
  });

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return '#FF3B30';
      case 'HIGH': return '#FF9500';
      case 'MEDIUM': return '#FFCC00';
      case 'LOW': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'alert-octagon';
      case 'HIGH': return 'alert-circle';
      case 'MEDIUM': return 'alert';
      case 'LOW': return 'information';
      default: return 'help-circle';
    }
  };

  const renderSummaryStats = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>📱 App Permission Analysis</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{scanResult.totalApps}</Text>
          <Text style={styles.statLabel}>Total Apps</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{scanResult.criticalApps}</Text>
          <Text style={styles.statLabel}>Critical Risk</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>{scanResult.highRiskApps}</Text>
          <Text style={styles.statLabel}>High Risk</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>{scanResult.safeApps}</Text>
          <Text style={styles.statLabel}>Safe Apps</Text>
        </View>
      </View>
    </View>
  );

  const renderRiskLevelFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              selectedRiskLevel === level && styles.filterButtonActive
            ]}
            onPress={() => setSelectedRiskLevel(level as any)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedRiskLevel === level && styles.filterButtonTextActive
            ]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPermissionCategory = (category: PermissionCategory) => (
    <View key={category.category} style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.category}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
        </View>
        <View style={[styles.categoryRiskBadge, { backgroundColor: getRiskLevelColor(category.riskLevel) }]}>
          <Text style={styles.categoryRiskText}>{category.riskLevel}</Text>
        </View>
      </View>
      <View style={styles.permissionsList}>
        {category.permissions.map((permission, index) => (
          <Text key={index} style={styles.permissionItem}>
            • {permission.replace('android.permission.', '')}
          </Text>
        ))}
      </View>
    </View>
  );

  const renderAppCard = (app: AppPermissionInfo) => {
    const isExpanded = expandedApp === app.packageName;
    
    return (
      <View key={app.packageName} style={styles.appCard}>
        <TouchableOpacity
          style={styles.appHeader}
          onPress={() => setExpandedApp(isExpanded ? null : app.packageName)}
        >
          <View style={styles.appInfo}>
            <View style={styles.appTitleRow}>
              <Text style={styles.appName}>{app.appName}</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(app.riskLevel) }]}>
                <MaterialCommunityIcons
                  name={getRiskLevelIcon(app.riskLevel) as any}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.riskBadgeText}>{app.riskLevel}</Text>
              </View>
            </View>
            <Text style={styles.packageName}>{app.packageName}</Text>
            <View style={styles.appStats}>
              <Text style={styles.appStat}>
                Risk Score: <Text style={styles.appStatValue}>{app.riskScore}</Text>
              </Text>
              <Text style={styles.appStat}>
                Permissions: <Text style={styles.appStatValue}>{app.permissions.length}</Text>
              </Text>
              <Text style={styles.appStat}>
                Dangerous: <Text style={[styles.appStatValue, { color: '#FF3B30' }]}>{app.dangerousPermissions.length}</Text>
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#8E8E93"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.appDetails}>
            {/* Permission Categories */}
            <Text style={styles.sectionTitle}>🔒 Permission Categories</Text>
            {app.permissionCategories.map(renderPermissionCategory)}

            {/* Dangerous Permissions */}
            {app.dangerousPermissions.length > 0 && (
              <View style={styles.dangerousPermissionsSection}>
                <Text style={styles.sectionTitle}>⚠️ Dangerous Permissions</Text>
                {app.dangerousPermissions.map((permission, index) => (
                  <View key={index} style={styles.dangerousPermissionItem}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.dangerousPermissionText}>
                      {permission.replace('android.permission.', '')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onAppAction?.(app, 'view_details')}
              >
                <MaterialCommunityIcons name="information" size={16} color="#007AFF" />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => onAppAction?.(app, 'open_settings')}
              >
                <MaterialCommunityIcons name="cog" size={16} color="#FF9500" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>App Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (scanResult.riskyApps.length === 0) {
    return (
      <View style={styles.container}>
        {renderSummaryStats()}
        <View style={styles.noRiskyAppsContainer}>
          <MaterialCommunityIcons name="shield-check" size={64} color="#34C759" />
          <Text style={styles.noRiskyAppsTitle}>🎉 All Apps Look Safe!</Text>
          <Text style={styles.noRiskyAppsMessage}>
            We analyzed {scanResult.totalApps} apps and found no apps with suspicious permission patterns.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSummaryStats()}
      {renderRiskLevelFilter()}
      
      <ScrollView style={styles.appsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.appsTitle}>
          🚨 Risky Apps ({filteredApps.length})
        </Text>
        {filteredApps.map(renderAppCard)}
      </ScrollView>
    </View>
  );
};

// ==============================================================================
// STYLES
// ==============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  noRiskyAppsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noRiskyAppsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noRiskyAppsMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  appsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  appsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  appInfo: {
    flex: 1,
  },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  packageName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  appStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appStat: {
    fontSize: 12,
    color: '#8E8E93',
  },
  appStatValue: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryRiskText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  permissionsList: {
    marginLeft: 32,
  },
  permissionItem: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  dangerousPermissionsSection: {
    marginTop: 8,
  },
  dangerousPermissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dangerousPermissionText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderColor: '#FF9500',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtonTextSecondary: {
    color: '#FF9500',
  },
});

export default AppPermissionResults;
