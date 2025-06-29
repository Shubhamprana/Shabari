package com.shabari.yara;

import android.util.Log;
import java.io.File;

public class YaraEngine {
    private static final String TAG = "YaraEngine";
    
    static {
        try {
            System.loadLibrary("yara-engine");
            Log.d(TAG, "Native library loaded successfully");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native library", e);
        }
    }

    private YaraRuleManager ruleManager;
    private boolean isInitialized = false;

    public YaraEngine() {
        this.ruleManager = new YaraRuleManager();
    }

    // Native method declarations
    private native boolean nativeInitialize();
    private native boolean nativeLoadRules(String rulesContent);
    private native YaraScanResult nativeScanFile(String filePath);
    private native YaraScanResult nativeScanMemory(byte[] data);
    private native String nativeGetVersion();
    private native int nativeGetLoadedRulesCount();
    private native void nativeCleanup();

    public boolean initialize() {
        try {
            if (isInitialized) {
                Log.w(TAG, "YARA engine already initialized");
                return true;
            }

            boolean success = nativeInitialize();
            if (success) {
                // Load default rules
                String defaultRules = getDefaultRules();
                success = nativeLoadRules(defaultRules);
                if (success) {
                    isInitialized = true;
                    Log.i(TAG, "YARA engine initialized with default rules");
                } else {
                    Log.e(TAG, "Failed to load default rules");
                }
            } else {
                Log.e(TAG, "Failed to initialize native YARA engine");
            }
            
            return success;
        } catch (Exception e) {
            Log.e(TAG, "Exception during initialization", e);
            return false;
        }
    }

    public boolean loadRules(String rulesPath) {
        if (!isInitialized) {
            Log.e(TAG, "YARA engine not initialized");
            return false;
        }

        try {
            File rulesFile = new File(rulesPath);
            if (!rulesFile.exists()) {
                Log.e(TAG, "Rules file does not exist: " + rulesPath);
                return false;
            }

            String rulesContent = ruleManager.loadRulesFromFile(rulesPath);
            if (rulesContent == null) {
                Log.e(TAG, "Failed to read rules file");
                return false;
            }

            return nativeLoadRules(rulesContent);
        } catch (Exception e) {
            Log.e(TAG, "Exception loading rules", e);
            return false;
        }
    }

    public boolean updateRules(String rulesContent) {
        if (!isInitialized) {
            Log.e(TAG, "YARA engine not initialized");
            return false;
        }

        try {
            if (rulesContent == null || rulesContent.trim().isEmpty()) {
                Log.e(TAG, "Rules content is empty");
                return false;
            }

            return nativeLoadRules(rulesContent);
        } catch (Exception e) {
            Log.e(TAG, "Exception updating rules", e);
            return false;
        }
    }

    public YaraScanResult scanFile(String filePath) {
        if (!isInitialized) {
            Log.e(TAG, "YARA engine not initialized");
            return null;
        }

        try {
            File file = new File(filePath);
            if (!file.exists()) {
                Log.e(TAG, "File does not exist: " + filePath);
                return null;
            }

            if (!file.canRead()) {
                Log.e(TAG, "Cannot read file: " + filePath);
                return null;
            }

            long startTime = System.currentTimeMillis();
            YaraScanResult result = nativeScanFile(filePath);
            long endTime = System.currentTimeMillis();

            if (result != null) {
                result.setScanTime((int)(endTime - startTime));
                result.setFileSize(file.length());
                Log.d(TAG, "File scan completed in " + (endTime - startTime) + "ms");
            }

            return result;
        } catch (Exception e) {
            Log.e(TAG, "Exception scanning file", e);
            return null;
        }
    }

    public YaraScanResult scanMemory(byte[] data) {
        if (!isInitialized) {
            Log.e(TAG, "YARA engine not initialized");
            return null;
        }

        try {
            if (data == null || data.length == 0) {
                Log.e(TAG, "Memory data is empty");
                return null;
            }

            long startTime = System.currentTimeMillis();
            YaraScanResult result = nativeScanMemory(data);
            long endTime = System.currentTimeMillis();

            if (result != null) {
                result.setScanTime((int)(endTime - startTime));
                result.setFileSize(data.length);
                Log.d(TAG, "Memory scan completed in " + (endTime - startTime) + "ms");
            }

            return result;
        } catch (Exception e) {
            Log.e(TAG, "Exception scanning memory", e);
            return null;
        }
    }

    public String getVersion() {
        try {
            return nativeGetVersion();
        } catch (Exception e) {
            Log.e(TAG, "Exception getting version", e);
            return "Unknown";
        }
    }

    public int getLoadedRulesCount() {
        if (!isInitialized) {
            return 0;
        }

        try {
            return nativeGetLoadedRulesCount();
        } catch (Exception e) {
            Log.e(TAG, "Exception getting rules count", e);
            return 0;
        }
    }

    public void cleanup() {
        try {
            if (isInitialized) {
                nativeCleanup();
                isInitialized = false;
                Log.i(TAG, "YARA engine cleaned up");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during cleanup", e);
        }
    }

    private String getDefaultRules() {
        return "rule Android_Banking_Trojan {\n" +
               "    meta:\n" +
               "        description = \"Detects Android banking trojans\"\n" +
               "        severity = \"high\"\n" +
               "        category = \"malware\"\n" +
               "    strings:\n" +
               "        $banking1 = \"com.android.vending.BILLING\"\n" +
               "        $banking2 = \"overlay_service\"\n" +
               "        $banking3 = \"accessibility_service\"\n" +
               "        $banking4 = \"BIND_ACCESSIBILITY_SERVICE\"\n" +
               "    condition:\n" +
               "        2 of ($banking*)\n" +
               "}\n\n" +
               
               "rule Fake_WhatsApp_APK {\n" +
               "    meta:\n" +
               "        description = \"Detects fake WhatsApp applications\"\n" +
               "        severity = \"critical\"\n" +
               "        category = \"impersonation\"\n" +
               "    strings:\n" +
               "        $whatsapp1 = \"com.whatsapp\"\n" +
               "        $fake1 = \"whatsapp_plus\"\n" +
               "        $fake2 = \"gbwhatsapp\"\n" +
               "        $fake3 = \"whatsapp_gb\"\n" +
               "    condition:\n" +
               "        $whatsapp1 and any of ($fake*)\n" +
               "}\n\n" +
               
               "rule Malicious_PDF_Exploit {\n" +
               "    meta:\n" +
               "        description = \"Detects PDF exploits\"\n" +
               "        severity = \"medium\"\n" +
               "        category = \"exploit\"\n" +
               "    strings:\n" +
               "        $pdf_header = \"%PDF\"\n" +
               "        $js_exploit = \"/JavaScript\"\n" +
               "        $embed_file = \"/EmbeddedFile\"\n" +
               "        $launch_action = \"/Launch\"\n" +
               "    condition:\n" +
               "        $pdf_header at 0 and ($js_exploit or $embed_file or $launch_action)\n" +
               "}\n\n" +
               
               "rule Android_Malware_APK {\n" +
               "    meta:\n" +
               "        description = \"Generic Android malware detection\"\n" +
               "        severity = \"high\"\n" +
               "        category = \"malware\"\n" +
               "    strings:\n" +
               "        $dex_header = \"dex\\n\"\n" +
               "        $malware1 = \"sendTextMessage\"\n" +
               "        $malware2 = \"abortBroadcast\"\n" +
               "        $malware3 = \"RECEIVE_SMS\"\n" +
               "        $malware4 = \"android.permission.SEND_SMS\"\n" +
               "    condition:\n" +
               "        $dex_header at 0 and 2 of ($malware*)\n" +
               "}";
    }
}

