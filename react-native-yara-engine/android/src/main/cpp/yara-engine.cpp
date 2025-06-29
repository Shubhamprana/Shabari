#include "yara-engine.h"
#include <jni.h>
#include <android/log.h>
#include <yara.h>
#include <string.h>
#include <stdlib.h>
#include <pthread.h>

#define LOG_TAG "YaraEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

// Global variables
static YR_COMPILER* g_compiler = NULL;
static YR_RULES* g_rules = NULL;
static pthread_mutex_t g_mutex = PTHREAD_MUTEX_INITIALIZER;
static bool g_initialized = false;

// Helper function to create YaraScanResult object
jobject createScanResult(JNIEnv* env, bool isSafe, const char* threatName, 
                        const char* category, const char* severity, 
                        jobjectArray matchedRules, const char* details) {
    
    jclass scanResultClass = env->FindClass("com/shabari/yara/YaraScanResult");
    if (!scanResultClass) {
        LOGE("Failed to find YaraScanResult class");
        return NULL;
    }

    jmethodID constructor = env->GetMethodID(scanResultClass, "<init>", "()V");
    if (!constructor) {
        LOGE("Failed to find YaraScanResult constructor");
        return NULL;
    }

    jobject scanResult = env->NewObject(scanResultClass, constructor);
    if (!scanResult) {
        LOGE("Failed to create YaraScanResult object");
        return NULL;
    }

    // Set fields
    jmethodID setSafeMethod = env->GetMethodID(scanResultClass, "setSafe", "(Z)V");
    jmethodID setThreatNameMethod = env->GetMethodID(scanResultClass, "setThreatName", "(Ljava/lang/String;)V");
    jmethodID setThreatCategoryMethod = env->GetMethodID(scanResultClass, "setThreatCategory", "(Ljava/lang/String;)V");
    jmethodID setSeverityMethod = env->GetMethodID(scanResultClass, "setSeverity", "(Ljava/lang/String;)V");
    jmethodID setDetailsMethod = env->GetMethodID(scanResultClass, "setDetails", "(Ljava/lang/String;)V");

    if (setSafeMethod) env->CallVoidMethod(scanResult, setSafeMethod, isSafe);
    if (setThreatNameMethod && threatName) {
        jstring jThreatName = env->NewStringUTF(threatName);
        env->CallVoidMethod(scanResult, setThreatNameMethod, jThreatName);
        env->DeleteLocalRef(jThreatName);
    }
    if (setThreatCategoryMethod && category) {
        jstring jCategory = env->NewStringUTF(category);
        env->CallVoidMethod(scanResult, setThreatCategoryMethod, jCategory);
        env->DeleteLocalRef(jCategory);
    }
    if (setSeverityMethod && severity) {
        jstring jSeverity = env->NewStringUTF(severity);
        env->CallVoidMethod(scanResult, setSeverityMethod, jSeverity);
        env->DeleteLocalRef(jSeverity);
    }
    if (setDetailsMethod && details) {
        jstring jDetails = env->NewStringUTF(details);
        env->CallVoidMethod(scanResult, setDetailsMethod, jDetails);
        env->DeleteLocalRef(jDetails);
    }

    return scanResult;
}

// Callback function for YARA scan results
int scanCallback(YR_SCAN_CONTEXT* context, int message, void* message_data, void* user_data) {
    if (message == CALLBACK_MSG_RULE_MATCHING) {
        YR_RULE* rule = (YR_RULE*)message_data;
        LOGD("Rule matched: %s", rule->identifier);
        
        // Store matched rule in user_data (assuming it's a vector or similar)
        // For simplicity, we'll just log it here
        return CALLBACK_CONTINUE;
    }
    return CALLBACK_CONTINUE;
}

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_shabari_yara_YaraEngine_nativeInitialize(JNIEnv* env, jobject thiz) {
    pthread_mutex_lock(&g_mutex);
    
    if (g_initialized) {
        LOGD("YARA engine already initialized");
        pthread_mutex_unlock(&g_mutex);
        return JNI_TRUE;
    }

    int result = yr_initialize();
    if (result != ERROR_SUCCESS) {
        LOGE("Failed to initialize YARA library: %d", result);
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    result = yr_compiler_create(&g_compiler);
    if (result != ERROR_SUCCESS) {
        LOGE("Failed to create YARA compiler: %d", result);
        yr_finalize();
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    g_initialized = true;
    LOGI("YARA engine initialized successfully");
    pthread_mutex_unlock(&g_mutex);
    return JNI_TRUE;
}

JNIEXPORT jboolean JNICALL
Java_com_shabari_yara_YaraEngine_nativeLoadRules(JNIEnv* env, jobject thiz, jstring rulesContent) {
    pthread_mutex_lock(&g_mutex);
    
    if (!g_initialized || !g_compiler) {
        LOGE("YARA engine not initialized");
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    const char* rules = env->GetStringUTFChars(rulesContent, NULL);
    if (!rules) {
        LOGE("Failed to get rules content");
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    // Clean up previous rules if they exist
    if (g_rules) {
        yr_rules_destroy(g_rules);
        g_rules = NULL;
    }

    // Compile rules
    int result = yr_compiler_add_string(g_compiler, rules, NULL);
    env->ReleaseStringUTFChars(rulesContent, rules);

    if (result != 0) {
        LOGE("Failed to compile YARA rules: %d", result);
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    result = yr_compiler_get_rules(g_compiler, &g_rules);
    if (result != ERROR_SUCCESS) {
        LOGE("Failed to get compiled rules: %d", result);
        pthread_mutex_unlock(&g_mutex);
        return JNI_FALSE;
    }

    LOGI("YARA rules loaded successfully");
    pthread_mutex_unlock(&g_mutex);
    return JNI_TRUE;
}

JNIEXPORT jobject JNICALL
Java_com_shabari_yara_YaraEngine_nativeScanFile(JNIEnv* env, jobject thiz, jstring filePath) {
    pthread_mutex_lock(&g_mutex);
    
    if (!g_initialized || !g_rules) {
        LOGE("YARA engine not initialized or no rules loaded");
        pthread_mutex_unlock(&g_mutex);
        return NULL;
    }

    const char* path = env->GetStringUTFChars(filePath, NULL);
    if (!path) {
        LOGE("Failed to get file path");
        pthread_mutex_unlock(&g_mutex);
        return NULL;
    }

    int result = yr_rules_scan_file(g_rules, path, SCAN_FLAGS_REPORT_RULES_MATCHING, 
                                   scanCallback, NULL, 0);
    
    env->ReleaseStringUTFChars(filePath, path);

    jobject scanResult;
    if (result == ERROR_SUCCESS) {
        // No matches found - file is safe
        scanResult = createScanResult(env, true, "", "", "", NULL, "No threats detected");
        LOGD("File scan completed - no threats detected");
    } else if (result == ERROR_CALLBACK_ERROR) {
        // Rules matched - potential threat
        scanResult = createScanResult(env, false, "Generic_Threat", "malware", "medium", 
                                    NULL, "Potential threat detected by YARA rules");
        LOGD("File scan completed - threats detected");
    } else {
        // Scan error
        LOGE("YARA scan failed: %d", result);
        scanResult = NULL;
    }

    pthread_mutex_unlock(&g_mutex);
    return scanResult;
}

JNIEXPORT jobject JNICALL
Java_com_shabari_yara_YaraEngine_nativeScanMemory(JNIEnv* env, jobject thiz, jbyteArray data) {
    pthread_mutex_lock(&g_mutex);
    
    if (!g_initialized || !g_rules) {
        LOGE("YARA engine not initialized or no rules loaded");
        pthread_mutex_unlock(&g_mutex);
        return NULL;
    }

    jsize dataLength = env->GetArrayLength(data);
    jbyte* dataBytes = env->GetByteArrayElements(data, NULL);
    
    if (!dataBytes) {
        LOGE("Failed to get data bytes");
        pthread_mutex_unlock(&g_mutex);
        return NULL;
    }

    int result = yr_rules_scan_mem(g_rules, (uint8_t*)dataBytes, dataLength, 
                                  SCAN_FLAGS_REPORT_RULES_MATCHING, scanCallback, NULL, 0);
    
    env->ReleaseByteArrayElements(data, dataBytes, JNI_ABORT);

    jobject scanResult;
    if (result == ERROR_SUCCESS) {
        // No matches found - data is safe
        scanResult = createScanResult(env, true, "", "", "", NULL, "No threats detected");
        LOGD("Memory scan completed - no threats detected");
    } else if (result == ERROR_CALLBACK_ERROR) {
        // Rules matched - potential threat
        scanResult = createScanResult(env, false, "Generic_Threat", "malware", "medium", 
                                    NULL, "Potential threat detected by YARA rules");
        LOGD("Memory scan completed - threats detected");
    } else {
        // Scan error
        LOGE("YARA memory scan failed: %d", result);
        scanResult = NULL;
    }

    pthread_mutex_unlock(&g_mutex);
    return scanResult;
}

JNIEXPORT jstring JNICALL
Java_com_shabari_yara_YaraEngine_nativeGetVersion(JNIEnv* env, jobject thiz) {
    return env->NewStringUTF("YARA v4.5.0");
}

JNIEXPORT jint JNICALL
Java_com_shabari_yara_YaraEngine_nativeGetLoadedRulesCount(JNIEnv* env, jobject thiz) {
    pthread_mutex_lock(&g_mutex);
    
    if (!g_rules) {
        pthread_mutex_unlock(&g_mutex);
        return 0;
    }

    int count = 0;
    YR_RULE* rule = NULL;
    yr_rules_foreach(g_rules, rule) {
        count++;
    }

    pthread_mutex_unlock(&g_mutex);
    return count;
}

JNIEXPORT void JNICALL
Java_com_shabari_yara_YaraEngine_nativeCleanup(JNIEnv* env, jobject thiz) {
    pthread_mutex_lock(&g_mutex);
    
    if (g_rules) {
        yr_rules_destroy(g_rules);
        g_rules = NULL;
    }

    if (g_compiler) {
        yr_compiler_destroy(g_compiler);
        g_compiler = NULL;
    }

    if (g_initialized) {
        yr_finalize();
        g_initialized = false;
    }

    LOGI("YARA engine cleaned up");
    pthread_mutex_unlock(&g_mutex);
}

}

