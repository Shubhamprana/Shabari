package com.shabari.yara;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import android.util.Log;

public class YaraModule extends ReactContextBaseJavaModule {
    private static final String TAG = "YaraModule";
    private YaraEngine yaraEngine;

    public YaraModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.yaraEngine = new YaraEngine();
    }

    @Override
    public String getName() {
        return "YaraEngine";
    }

    @ReactMethod
    public void initializeEngine(Promise promise) {
        try {
            Log.d(TAG, "Initializing YARA engine");
            boolean success = yaraEngine.initialize();
            if (success) {
                promise.resolve("YARA engine initialized successfully");
            } else {
                promise.reject("INIT_ERROR", "Failed to initialize YARA engine");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initializing YARA engine", e);
            promise.reject("INIT_ERROR", "Error initializing YARA engine: " + e.getMessage());
        }
    }

    @ReactMethod
    public void loadRules(String rulesPath, Promise promise) {
        try {
            Log.d(TAG, "Loading YARA rules from: " + rulesPath);
            boolean success = yaraEngine.loadRules(rulesPath);
            if (success) {
                promise.resolve("Rules loaded successfully");
            } else {
                promise.reject("LOAD_RULES_ERROR", "Failed to load YARA rules");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading YARA rules", e);
            promise.reject("LOAD_RULES_ERROR", "Error loading YARA rules: " + e.getMessage());
        }
    }

    @ReactMethod
    public void scanFile(String filePath, Promise promise) {
        try {
            Log.d(TAG, "Scanning file: " + filePath);
            YaraScanResult result = yaraEngine.scanFile(filePath);
            if (result != null) {
                WritableMap resultMap = result.toWritableMap();
                promise.resolve(resultMap);
            } else {
                promise.reject("SCAN_ERROR", "Failed to scan file");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error scanning file", e);
            promise.reject("SCAN_ERROR", "Error scanning file: " + e.getMessage());
        }
    }

    @ReactMethod
    public void scanMemory(ReadableArray data, Promise promise) {
        try {
            Log.d(TAG, "Scanning memory data");
            byte[] byteArray = new byte[data.size()];
            for (int i = 0; i < data.size(); i++) {
                byteArray[i] = (byte) data.getInt(i);
            }
            
            YaraScanResult result = yaraEngine.scanMemory(byteArray);
            if (result != null) {
                WritableMap resultMap = result.toWritableMap();
                promise.resolve(resultMap);
            } else {
                promise.reject("SCAN_ERROR", "Failed to scan memory");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error scanning memory", e);
            promise.reject("SCAN_ERROR", "Error scanning memory: " + e.getMessage());
        }
    }

    @ReactMethod
    public void updateRules(String rulesContent, Promise promise) {
        try {
            Log.d(TAG, "Updating YARA rules");
            boolean success = yaraEngine.updateRules(rulesContent);
            if (success) {
                promise.resolve("Rules updated successfully");
            } else {
                promise.reject("UPDATE_RULES_ERROR", "Failed to update YARA rules");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating YARA rules", e);
            promise.reject("UPDATE_RULES_ERROR", "Error updating YARA rules: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getEngineVersion(Promise promise) {
        try {
            String version = yaraEngine.getVersion();
            promise.resolve(version);
        } catch (Exception e) {
            Log.e(TAG, "Error getting engine version", e);
            promise.reject("VERSION_ERROR", "Error getting engine version: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getLoadedRulesCount(Promise promise) {
        try {
            int count = yaraEngine.getLoadedRulesCount();
            promise.resolve(count);
        } catch (Exception e) {
            Log.e(TAG, "Error getting loaded rules count", e);
            promise.reject("COUNT_ERROR", "Error getting loaded rules count: " + e.getMessage());
        }
    }
}

