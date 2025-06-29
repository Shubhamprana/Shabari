#ifndef YARA_ENGINE_H
#define YARA_ENGINE_H

#include <jni.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// JNI function declarations
JNIEXPORT jboolean JNICALL
Java_com_shabari_yara_YaraEngine_nativeInitialize(JNIEnv* env, jobject thiz);

JNIEXPORT jboolean JNICALL
Java_com_shabari_yara_YaraEngine_nativeLoadRules(JNIEnv* env, jobject thiz, jstring rulesContent);

JNIEXPORT jobject JNICALL
Java_com_shabari_yara_YaraEngine_nativeScanFile(JNIEnv* env, jobject thiz, jstring filePath);

JNIEXPORT jobject JNICALL
Java_com_shabari_yara_YaraEngine_nativeScanMemory(JNIEnv* env, jobject thiz, jbyteArray data);

JNIEXPORT jstring JNICALL
Java_com_shabari_yara_YaraEngine_nativeGetVersion(JNIEnv* env, jobject thiz);

JNIEXPORT jint JNICALL
Java_com_shabari_yara_YaraEngine_nativeGetLoadedRulesCount(JNIEnv* env, jobject thiz);

JNIEXPORT void JNICALL
Java_com_shabari_yara_YaraEngine_nativeCleanup(JNIEnv* env, jobject thiz);

// Helper functions
jobject createScanResult(JNIEnv* env, bool isSafe, const char* threatName, 
                        const char* category, const char* severity, 
                        jobjectArray matchedRules, const char* details);

int scanCallback(YR_SCAN_CONTEXT* context, int message, void* message_data, void* user_data);

#ifdef __cplusplus
}
#endif

#endif // YARA_ENGINE_H

