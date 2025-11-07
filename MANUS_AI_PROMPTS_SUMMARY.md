# 📋 Manus AI Prompts Summary

## Overview
This document summarizes the two comprehensive prompts created for generating code with Manus AI for the Shabari cybersecurity app.

---

## 🐕 Prompt 1: Watchdog Feature

**File**: `MANUS_AI_WATCHDOG_PROMPT.md`

### What It Does
Creates a **background file monitoring system** that automatically detects new files on the device, scans them for threats in real-time, and protects users without manual intervention.

### Key Features
- ✅ Background file monitoring
- ✅ Real-time threat detection
- ✅ Automatic scanning
- ✅ Immediate notifications
- ✅ Auto-quarantine integration
- ✅ Premium feature gating
- ✅ Android-compliant (scoped storage)

### File Structure Generated
- **Services**: 5 core services (WatchdogService, FileMonitor, ScanEngine, NotificationService, Config)
- **Native Modules**: 4 Kotlin files (Module, FileObserver, ForegroundService, ServiceManager)
- **Components**: 3 React Native components (StatusCard, SettingsPanel, ThreatAlert)
- **Screens**: 1 settings screen
- **Store**: Zustand store for state management
- **Types**: Complete TypeScript definitions

### Integration Points
- YaraSecurityService (scanning)
- QuarantineService (threat handling)
- ExpoNotificationService (notifications)
- PermissionManager (permissions)
- subscriptionStore (premium checks)

---

## 🔍 Prompt 2: Enhanced Deep Scan Feature

**File**: `MANUS_AI_DEEP_SCAN_PROMPT.md`

### What It Does
Creates an **enhanced comprehensive device security scanner** that performs thorough scans of the entire device, detects malware, suspicious apps, corrupted files, and provides detailed threat analysis.

### Key Features
- ✅ Multi-stage scanning (files, apps, permissions)
- ✅ Real-time progress tracking
- ✅ Advanced threat detection (YARA + heuristic)
- ✅ App permission analysis
- ✅ Performance optimized
- ✅ Beautiful UI with animations
- ✅ Actionable results

### File Structure Generated
- **Services**: 8 enhanced services (EnhancedDeepScanService, Engine, FileScanner, AppAnalyzer, ThreatAnalyzer, ProgressManager, Config, Cache)
- **Components**: 6 React Native components (ProgressCard, ThreatCard, StatisticsCard, ConfigPanel, ResultSummary, ActionButtons)
- **Screens**: Enhanced DeepScanScreen
- **Store**: Zustand store for deep scan state
- **Types**: Complete TypeScript definitions

### Integration Points
- YaraSecurityService (primary scanning)
- AppPermissionAnalyzer (app analysis)
- QuarantineService (threat handling)
- ExpoNotificationService (notifications)
- PermissionManager (permissions)

---

## 📝 How to Use These Prompts

### Step 1: Watchdog Feature
1. Open `MANUS_AI_WATCHDOG_PROMPT.md`
2. Copy the entire content
3. Paste into Manus AI
4. Generate code
5. Manus AI will provide a zip file with all code

### Step 2: Deep Scan Feature
1. Open `MANUS_AI_DEEP_SCAN_PROMPT.md`
2. Copy the entire content
3. Paste into Manus AI
4. Generate code
5. Manus AI will provide a zip file with all code

### Step 3: Integration
1. Extract both zip files
2. Review the generated code
3. Integrate with existing codebase
4. Test thoroughly
5. Deploy

---

## 📁 File Locations After Generation

### Watchdog Files Will Be:
```
src/
├── services/
│   ├── WatchdogService.ts
│   ├── WatchdogFileMonitor.ts
│   ├── WatchdogScanEngine.ts
│   ├── WatchdogNotificationService.ts
│   └── WatchdogConfig.ts
├── native/android/...
├── components/
│   ├── WatchdogStatusCard.tsx
│   ├── WatchdogSettingsPanel.tsx
│   └── WatchdogThreatAlert.tsx
├── screens/
│   └── WatchdogSettingsScreen.tsx
├── stores/
│   └── watchdogStore.ts
└── types/
    └── watchdog.types.ts
```

### Deep Scan Files Will Be:
```
src/
├── services/
│   ├── EnhancedDeepScanService.ts (enhanced)
│   ├── DeepScanEngine.ts
│   ├── DeepScanFileScanner.ts
│   ├── DeepScanAppAnalyzer.ts
│   ├── DeepScanThreatAnalyzer.ts
│   ├── DeepScanProgressManager.ts
│   ├── DeepScanConfig.ts
│   └── DeepScanCache.ts
├── components/
│   ├── DeepScanProgressCard.tsx
│   ├── DeepScanThreatCard.tsx
│   ├── DeepScanStatisticsCard.tsx
│   ├── DeepScanConfigPanel.tsx
│   ├── DeepScanResultSummary.tsx
│   └── DeepScanActionButtons.tsx
├── screens/
│   └── EnhancedDeepScanScreen.tsx (enhanced)
├── stores/
│   └── deepScanStore.ts
└── types/
    └── deepScan.types.ts
```

---

## ✅ Integration Checklist

### After Getting Watchdog Code:
- [ ] Review all generated files
- [ ] Check AndroidManifest.xml updates
- [ ] Integrate with App.tsx initialization
- [ ] Add to DashboardScreen navigation
- [ ] Test premium subscription checks
- [ ] Test file detection
- [ ] Test notifications
- [ ] Test permissions flow
- [ ] Verify Android compliance

### After Getting Deep Scan Code:
- [ ] Review all generated files
- [ ] Enhance existing DeepScanService.ts if needed
- [ ] Integrate with existing services
- [ ] Update navigation
- [ ] Test quick scan
- [ ] Test full scan
- [ ] Test progress tracking
- [ ] Test threat detection
- [ ] Test app permission analysis
- [ ] Verify performance

---

## 🎯 Key Points to Remember

1. **Watchdog First**: Generate Watchdog feature first as it's independent
2. **Then Deep Scan**: Generate Deep Scan feature second
3. **Review Code**: Always review generated code before integration
4. **Test Thoroughly**: Test each feature independently before integration
5. **Follow Patterns**: Ensure generated code matches existing codebase patterns
6. **Update Dependencies**: Check if any new dependencies are needed
7. **Android Compliance**: Verify Play Store compliance for both features
8. **Performance**: Monitor performance impact of both features

---

## 📞 Support

If you encounter issues:
1. Check the detailed prompts for specific requirements
2. Review existing services for integration patterns
3. Check AndroidManifest.xml for required permissions
4. Verify all dependencies are installed
5. Test with small datasets first

---

## 🚀 Ready to Generate!

Both prompts are comprehensive and ready to use with Manus AI. They include:
- ✅ Complete file structures
- ✅ Detailed specifications
- ✅ Integration points
- ✅ Code style guidelines
- ✅ Testing requirements
- ✅ Success criteria

**Good luck with your code generation!** 🎉

