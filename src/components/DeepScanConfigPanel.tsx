/**
 * DeepScanConfigPanel.tsx
 * 
 * Scan configuration options panel with scan type selection,
 * directory checkboxes, file type filters, and advanced options.
 * 
 * @module DeepScanConfigPanel
 * @author Shabari Security Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { DeepScanConfig } from '../types/deepScan.types';

// ==================== PROPS ====================

export interface DeepScanConfigPanelProps {
  config: DeepScanConfig;
  onChange: (config: DeepScanConfig) => void;
}

// ==================== COMPONENT ====================

export const DeepScanConfigPanel: React.FC<DeepScanConfigPanelProps> = ({ config, onChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['scanType']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateConfig = (updates: Partial<DeepScanConfig>) => {
    onChange({ ...config, ...updates });
  };

  const setScanType = (type: 'quick' | 'full' | 'custom') => {
    if (type === 'quick') {
      onChange({
        ...config,
        scanType: 'quick',
        scanDownloads: true,
        scanDocuments: false,
        scanImages: false,
        scanWhatsApp: false,
        scanTelegram: false,
        scanCache: false,
        scanSystemDirs: false,
        scanAllFolders: false,
        scanSocialMediaFolders: false,
        recursiveScan: false,
        maxScanDepth: 2,
        scanPriority: 'speed',
      });
    } else if (type === 'full') {
      onChange({
        ...config,
        scanType: 'full',
        scanDownloads: true,
        scanDocuments: true,
        scanImages: true,
        scanWhatsApp: true,
        scanTelegram: true,
        scanCache: true,
        scanSystemDirs: false,
        scanAllFolders: true,
        scanSocialMediaFolders: true,
        recursiveScan: true,
        maxScanDepth: 10,
        scanPriority: 'thorough',
      });
    } else {
      onChange({ ...config, scanType: 'custom' });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Scan Type Selection */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('scanType')}
        >
          <MaterialCommunityIcons name="tune" size={20} color="#60a5fa" />
          <Text style={styles.sectionTitle}>Scan Type</Text>
          <MaterialCommunityIcons
            name={expandedSections.has('scanType') ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
        {expandedSections.has('scanType') && (
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.optionButton, config.scanType === 'quick' && styles.optionButtonActive]}
              onPress={() => setScanType('quick')}
            >
              <MaterialCommunityIcons
                name="flash"
                size={20}
                color={config.scanType === 'quick' ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.optionButtonText,
                  config.scanType === 'quick' && styles.optionButtonTextActive,
                ]}
              >
                Quick Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, config.scanType === 'full' && styles.optionButtonActive]}
              onPress={() => setScanType('full')}
            >
              <MaterialCommunityIcons
                name="shield-search"
                size={20}
                color={config.scanType === 'full' ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.optionButtonText,
                  config.scanType === 'full' && styles.optionButtonTextActive,
                ]}
              >
                Full Scan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, config.scanType === 'custom' && styles.optionButtonActive]}
              onPress={() => setScanType('custom')}
            >
              <MaterialCommunityIcons
                name="cog"
                size={20}
                color={config.scanType === 'custom' ? '#fff' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.optionButtonText,
                  config.scanType === 'custom' && styles.optionButtonTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* File Scanning Options */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('fileScanning')}
        >
          <MaterialCommunityIcons name="file-search" size={20} color="#60a5fa" />
          <Text style={styles.sectionTitle}>File Scanning</Text>
          <MaterialCommunityIcons
            name={expandedSections.has('fileScanning') ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
        {expandedSections.has('fileScanning') && (
          <View style={styles.sectionContent}>
            <ConfigSwitch
              label="Downloads"
              value={config.scanDownloads}
              onValueChange={(value) => updateConfig({ scanDownloads: value })}
            />
            <ConfigSwitch
              label="Documents"
              value={config.scanDocuments}
              onValueChange={(value) => updateConfig({ scanDocuments: value })}
            />
            <ConfigSwitch
              label="Images"
              value={config.scanImages}
              onValueChange={(value) => updateConfig({ scanImages: value })}
            />
            <ConfigSwitch
              label="WhatsApp"
              value={config.scanWhatsApp}
              onValueChange={(value) => updateConfig({ scanWhatsApp: value })}
            />
            <ConfigSwitch
              label="Telegram"
              value={config.scanTelegram}
              onValueChange={(value) => updateConfig({ scanTelegram: value })}
            />
            <ConfigSwitch
              label="APK Files"
              value={config.scanApkFiles}
              onValueChange={(value) => updateConfig({ scanApkFiles: value })}
            />
            <ConfigSwitch
              label="Cache"
              value={config.scanCache}
              onValueChange={(value) => updateConfig({ scanCache: value })}
            />
          </View>
        )}
      </View>

      {/* App Scanning Options */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('appScanning')}
        >
          <MaterialCommunityIcons name="cellphone" size={20} color="#60a5fa" />
          <Text style={styles.sectionTitle}>App Scanning</Text>
          <MaterialCommunityIcons
            name={expandedSections.has('appScanning') ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
        {expandedSections.has('appScanning') && (
          <View style={styles.sectionContent}>
            <ConfigSwitch
              label="Scan App Permissions"
              value={config.scanAppPermissions}
              onValueChange={(value) => updateConfig({ scanAppPermissions: value })}
            />
            <ConfigSwitch
              label="Scan All Apps"
              value={config.scanAllApps}
              onValueChange={(value) => updateConfig({ scanAllApps: value })}
            />
            <ConfigSwitch
              label="Scan User Apps"
              value={config.scanUserApps}
              onValueChange={(value) => updateConfig({ scanUserApps: value })}
            />
            <ConfigSwitch
              label="Scan System Apps"
              value={config.scanSystemApps}
              onValueChange={(value) => updateConfig({ scanSystemApps: value })}
            />
          </View>
        )}
      </View>

      {/* Advanced Options */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('advanced')}
        >
          <MaterialCommunityIcons name="cog" size={20} color="#60a5fa" />
          <Text style={styles.sectionTitle}>Advanced</Text>
          <MaterialCommunityIcons
            name={expandedSections.has('advanced') ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
        {expandedSections.has('advanced') && (
          <View style={styles.sectionContent}>
            <ConfigSwitch
              label="Enable YARA Engine"
              value={config.enableYaraEngine}
              onValueChange={(value) => updateConfig({ enableYaraEngine: value })}
            />
            <ConfigSwitch
              label="Heuristic Scan"
              value={config.enableHeuristicScan}
              onValueChange={(value) => updateConfig({ enableHeuristicScan: value })}
            />
            <ConfigSwitch
              label="Recursive Scan"
              value={config.recursiveScan}
              onValueChange={(value) => updateConfig({ recursiveScan: value })}
            />
            <ConfigSwitch
              label="Skip System Files"
              value={config.skipSystemFiles}
              onValueChange={(value) => updateConfig({ skipSystemFiles: value })}
            />
            <ConfigSwitch
              label="Skip Hidden Files"
              value={config.skipHiddenFiles}
              onValueChange={(value) => updateConfig({ skipHiddenFiles: value })}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ==================== CONFIG SWITCH COMPONENT ====================

interface ConfigSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const ConfigSwitch: React.FC<ConfigSwitchProps> = ({ label, value, onValueChange }) => {
  return (
    <View style={configSwitchStyles.container}>
      <Text style={configSwitchStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#3b82f6' }}
        thumbColor={value ? '#60a5fa' : '#94a3b8'}
      />
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
  },
  optionButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
});

const configSwitchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  label: {
    color: '#f1f5f9',
    fontSize: 14,
    flex: 1,
  },
});

export default DeepScanConfigPanel;

