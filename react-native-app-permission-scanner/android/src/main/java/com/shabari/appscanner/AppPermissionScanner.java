package com.shabari.appscanner;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PermissionInfo;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;

import java.util.List;
import java.io.File;

public class AppPermissionScanner extends ReactContextBaseJavaModule {
    
    private final ReactApplicationContext reactContext;

    public AppPermissionScanner(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }
    
    @Override
    public String getName() {
        return "AppPermissionScanner";
    }
    
    /**
     * Check if special permissions are granted
     */
    @ReactMethod
    public void checkSpecialPermissions(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            
            // Check PACKAGE_USAGE_STATS permission (Android 5.0+)
            boolean hasUsageStats = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
                if (usageStatsManager != null) {
                    long time = System.currentTimeMillis();
                    usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000, time);
                    hasUsageStats = true;
                }
            }
            
            // Check if we can query all packages (Android 11+)
            boolean canQueryAllPackages = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                PackageManager pm = reactContext.getPackageManager();
                try {
                    pm.getInstalledPackages(PackageManager.GET_PERMISSIONS);
                } catch (SecurityException e) {
                    canQueryAllPackages = false;
                }
            }
            
            result.putBoolean("hasUsageStats", hasUsageStats);
            result.putBoolean("canQueryAllPackages", canQueryAllPackages);
            result.putBoolean("allPermissionsGranted", hasUsageStats && canQueryAllPackages);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", "Failed to check special permissions: " + e.getMessage(), e);
        }
    }

    /**
     * Scan all installed apps and analyze their permissions
     */
    @ReactMethod
    public void scanInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<PackageInfo> packages = pm.getInstalledPackages(PackageManager.GET_PERMISSIONS);

            WritableArray appsArray = Arguments.createArray();
            int totalApps = 0;
            int riskyApps = 0;
            int criticalApps = 0;
            int highRiskApps = 0;
            int mediumRiskApps = 0;

            for (PackageInfo packageInfo : packages) {
                try {
                    // Get app information
                    ApplicationInfo appInfo = packageInfo.applicationInfo;
                    String packageName = packageInfo.packageName;
                    String appName = pm.getApplicationLabel(appInfo).toString();
                    boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

                    // Get permissions
                    WritableArray permissionsArray = Arguments.createArray();
                    WritableArray dangerousPermissionsArray = Arguments.createArray();
                    int riskScore = 0;

                    if (packageInfo.requestedPermissions != null) {
                        for (String permission : packageInfo.requestedPermissions) {
                            permissionsArray.pushString(permission);

                            // Calculate risk score based on permission type
                            int permissionRisk = calculatePermissionRisk(permission);
                            riskScore += permissionRisk;

                            if (permissionRisk >= 30) {
                                dangerousPermissionsArray.pushString(permission);
                            }
                        }
                    }

                    // Determine risk level
                    String riskLevel = determineRiskLevel(riskScore, dangerousPermissionsArray.size());

                    // Count by risk level
                    if (riskLevel.equals("CRITICAL")) {
                        criticalApps++;
                        riskyApps++;
                    } else if (riskLevel.equals("HIGH")) {
                        highRiskApps++;
                        riskyApps++;
                    } else if (riskLevel.equals("MEDIUM")) {
                        mediumRiskApps++;
                        riskyApps++;
                    }

                    // Create app object
                    WritableMap appMap = Arguments.createMap();
                    appMap.putString("packageName", packageName);
                    appMap.putString("appName", appName);
                    appMap.putBoolean("isSystemApp", isSystemApp);
                    appMap.putArray("permissions", permissionsArray);
                    appMap.putArray("dangerousPermissions", dangerousPermissionsArray);
                    appMap.putInt("riskScore", riskScore);
                    appMap.putString("riskLevel", riskLevel);
                    appMap.putDouble("installTime", packageInfo.firstInstallTime);
                    appMap.putDouble("lastUpdateTime", packageInfo.lastUpdateTime);

                    appsArray.pushMap(appMap);
                    totalApps++;

                } catch (Exception e) {
                    // Skip apps that can't be processed
                    continue;
                }
            }

            // Create result
            WritableMap result = Arguments.createMap();
            result.putInt("totalApps", totalApps);
            result.putInt("riskyApps", riskyApps);
            result.putInt("criticalApps", criticalApps);
            result.putInt("highRiskApps", highRiskApps);
            result.putInt("mediumRiskApps", mediumRiskApps);
            result.putArray("apps", appsArray);

            promise.resolve(result);

        } catch (Exception e) {
            promise.reject("SCAN_ERROR", "Failed to scan installed apps: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get detailed information about a specific app
     */
    @ReactMethod
    public void getAppDetails(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
            ApplicationInfo appInfo = packageInfo.applicationInfo;

            String appName = pm.getApplicationLabel(appInfo).toString();
            boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

            // Get permissions
            WritableArray permissionsArray = Arguments.createArray();
            WritableArray dangerousPermissionsArray = Arguments.createArray();
            int riskScore = 0;

            if (packageInfo.requestedPermissions != null) {
                for (String permission : packageInfo.requestedPermissions) {
                    permissionsArray.pushString(permission);

                    int permissionRisk = calculatePermissionRisk(permission);
                    riskScore += permissionRisk;

                    if (permissionRisk >= 30) {
                        dangerousPermissionsArray.pushString(permission);
                    }
                }
            }

            String riskLevel = determineRiskLevel(riskScore, dangerousPermissionsArray.size());

            // Create result
            WritableMap result = Arguments.createMap();
            result.putString("packageName", packageName);
            result.putString("appName", appName);
            result.putBoolean("isSystemApp", isSystemApp);
            result.putArray("permissions", permissionsArray);
            result.putArray("dangerousPermissions", dangerousPermissionsArray);
            result.putInt("riskScore", riskScore);
            result.putString("riskLevel", riskLevel);
            result.putDouble("installTime", packageInfo.firstInstallTime);
            result.putDouble("lastUpdateTime", packageInfo.lastUpdateTime);

            promise.resolve(result);

        } catch (Exception e) {
            promise.reject("APP_DETAILS_ERROR", "Failed to get app details: " + e.getMessage(), e);
        }
    }

    /**
     * Calculate risk score for a permission
     */
    private int calculatePermissionRisk(String permission) {
        // CRITICAL permissions (50 points each)
        if (permission.contains("SEND_SMS") ||
            permission.contains("RECEIVE_SMS") ||
            permission.contains("READ_SMS") ||
            permission.contains("CALL_PHONE") ||
            permission.contains("READ_CALL_LOG") ||
            permission.contains("WRITE_CALL_LOG")) {
            return 50;
        }

        // HIGH risk permissions (30 points each)
        if (permission.contains("CAMERA") ||
            permission.contains("RECORD_AUDIO") ||
            permission.contains("ACCESS_FINE_LOCATION") ||
            permission.contains("ACCESS_COARSE_LOCATION") ||
            permission.contains("READ_CONTACTS") ||
            permission.contains("WRITE_CONTACTS") ||
            permission.contains("GET_ACCOUNTS")) {
            return 30;
        }

        // MEDIUM risk permissions (20 points each)
        if (permission.contains("READ_EXTERNAL_STORAGE") ||
            permission.contains("WRITE_EXTERNAL_STORAGE") ||
            permission.contains("READ_CALENDAR") ||
            permission.contains("WRITE_CALENDAR") ||
            permission.contains("BODY_SENSORS")) {
            return 20;
        }

        // LOW risk permissions (5 points each)
        if (permission.contains("INTERNET") ||
            permission.contains("ACCESS_NETWORK_STATE") ||
            permission.contains("ACCESS_WIFI_STATE") ||
            permission.contains("BLUETOOTH") ||
            permission.contains("VIBRATE")) {
            return 5;
        }

        // Other permissions (1 point each)
        return 1;
    }

    /**
     * Determine overall risk level based on score and dangerous permission count
     */
    private String determineRiskLevel(int riskScore, int dangerousCount) {
        if (dangerousCount > 0 && riskScore >= 100) {
            return "CRITICAL";
        } else if (dangerousCount >= 2 || riskScore >= 60) {
            return "HIGH";
        } else if (dangerousCount >= 1 || riskScore >= 30) {
            return "MEDIUM";
        } else if (riskScore > 5) {
            return "LOW";
        } else {
            return "SAFE";
        }
    }

    /**
     * Extract APK manifest information from APK file
     * 
     * ⚠️ NOTE: This method attempts to extract manifest using PackageManager.
     * For more comprehensive extraction, consider using aapt2 (Android Asset Packaging Tool).
     * 
     * @param apkPath - Full path to APK file
     * @param promise - Promise to resolve with manifest data
     */
    @ReactMethod
    public void extractApkManifest(String apkPath, Promise promise) {
        try {
            File apkFile = new File(apkPath);
            
            if (!apkFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found: " + apkPath);
                return;
            }

            PackageManager pm = reactContext.getPackageManager();
            
            // Try to get package info using PackageManager
            // This works for APK files that can be parsed
            PackageInfo packageInfo = null;
            try {
                // Use PackageManager to parse APK
                packageInfo = pm.getPackageArchiveInfo(apkPath, PackageManager.GET_PERMISSIONS | PackageManager.GET_ACTIVITIES | PackageManager.GET_SERVICES | PackageManager.GET_RECEIVERS);
            } catch (Exception e) {
                // If PackageManager fails, we'll return minimal info
                android.util.Log.w("AppPermissionScanner", "PackageManager parsing failed: " + e.getMessage());
            }

            WritableMap manifest = Arguments.createMap();
            
            if (packageInfo != null && packageInfo.applicationInfo != null) {
                // Successfully parsed with PackageManager
                manifest.putString("packageName", packageInfo.packageName);
                manifest.putString("versionName", packageInfo.versionName != null ? packageInfo.versionName : "1.0.0");
                manifest.putInt("versionCode", packageInfo.versionCode);
                
                // Extract permissions
                WritableArray permissionsArray = Arguments.createArray();
                if (packageInfo.requestedPermissions != null) {
                    for (String permission : packageInfo.requestedPermissions) {
                        permissionsArray.pushString(permission);
                    }
                }
                manifest.putArray("permissions", permissionsArray);
                
                // Extract activities
                WritableArray activitiesArray = Arguments.createArray();
                if (packageInfo.activities != null) {
                    for (android.content.pm.ActivityInfo activity : packageInfo.activities) {
                        activitiesArray.pushString(activity.name);
                    }
                }
                manifest.putArray("activities", activitiesArray);
                
                // Extract services
                WritableArray servicesArray = Arguments.createArray();
                if (packageInfo.services != null) {
                    for (android.content.pm.ServiceInfo service : packageInfo.services) {
                        servicesArray.pushString(service.name);
                    }
                }
                manifest.putArray("services", servicesArray);
                
                // Extract receivers
                WritableArray receiversArray = Arguments.createArray();
                if (packageInfo.receivers != null) {
                    for (android.content.pm.ActivityInfo receiver : packageInfo.receivers) {
                        receiversArray.pushString(receiver.name);
                    }
                }
                manifest.putArray("receivers", receiversArray);
                
                // Extract providers
                WritableArray providersArray = Arguments.createArray();
                if (packageInfo.providers != null) {
                    for (android.content.pm.ProviderInfo provider : packageInfo.providers) {
                        providersArray.pushString(provider.name);
                    }
                }
                manifest.putArray("providers", providersArray);
                
                // SDK versions
                manifest.putInt("minSdkVersion", packageInfo.applicationInfo.minSdkVersion);
                manifest.putInt("targetSdkVersion", packageInfo.applicationInfo.targetSdkVersion);
                
                manifest.putBoolean("extractionSuccessful", true);
                
            } else {
                // Fallback: Return minimal info from filename
                String apkName = apkFile.getName();
                manifest.putString("packageName", guessPackageName(apkName));
                manifest.putString("versionName", "1.0.0");
                manifest.putInt("versionCode", 1);
                manifest.putArray("permissions", Arguments.createArray());
                manifest.putArray("activities", Arguments.createArray());
                manifest.putArray("services", Arguments.createArray());
                manifest.putArray("receivers", Arguments.createArray());
                manifest.putArray("providers", Arguments.createArray());
                manifest.putInt("minSdkVersion", 21);
                manifest.putInt("targetSdkVersion", 33);
                manifest.putBoolean("extractionSuccessful", false);
                manifest.putString("warning", "APK manifest extraction failed. Using PackageManager.getPackageArchiveInfo() which may not work for all APKs. Consider using aapt2 for comprehensive extraction.");
            }
            
            // Add file metadata
            manifest.putString("apkPath", apkPath);
            manifest.putString("apkName", apkFile.getName());
            manifest.putLong("fileSize", apkFile.length());
            
            promise.resolve(manifest);
            
        } catch (Exception e) {
            promise.reject("APK_EXTRACTION_ERROR", "Failed to extract APK manifest: " + e.getMessage(), e);
        }
    }

    /**
     * Guess package name from APK filename
     */
    private String guessPackageName(String apkName) {
        // Remove .apk extension
        String name = apkName.replace(".apk", "");
        
        // Remove version numbers and common suffixes
        name = name.replaceAll("[-_]v?\\d+(\\.\\d+)*", "");
        name = name.replaceAll("[-_](release|debug|beta|alpha|final)$", "");
        
        // Convert to package name format
        name = name.toLowerCase().replaceAll("[^a-z0-9]", ".");
        
        return "com.unknown." + name;
    }
}