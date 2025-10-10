# ProGuard rules for Shabari App
# Keep Google Play Services classes for SMS retrieval

# Keep Google Auth API classes
-keep class com.google.android.gms.auth.api.credentials.** { *; }
-keep interface com.google.android.gms.auth.api.credentials.** { *; }

# Allow SMS Retriever PhoneNumberHelper to be stripped if unused (prevents missing Credentials API classes)
# Note: We're NOT keeping PhoneNumberHelper to avoid Credentials API dependency issues

# Keep Google Play Services common classes
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.auth.** { *; }

# Keep React Native SMS Retriever module (but not PhoneNumberHelper)
-keep class com.github.douglasjunior.ReactNativeSMSRetriever.** { *; }

# Don't warn about SMS Retriever classes that might be stripped
-dontwarn me.furtado.smsretriever.**

# Keep all classes that might be used by reflection
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# Keep React Native bridge classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Keep Expo modules
-keep class expo.modules.** { *; }

# Keep native modules that might be accessed via reflection
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# Keep Sentry classes
-keep class io.sentry.** { *; }

# Keep YARA Engine Native Module
-keep class com.shabari.yara.** { *; }
-keepclassmembers class com.shabari.yara.** { *; }
-dontwarn com.shabari.yara.**

# Keep Proxy Engine Native Module (Kotlin)
-keep class com.reactnativeproxyengine.** { *; }
-keepclassmembers class com.reactnativeproxyengine.** { *; }
-dontwarn com.reactnativeproxyengine.**

# Keep Kotlin coroutines for Proxy Engine
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Keep OkHttp for network operations
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep VPN Service classes
-keep class * extends android.net.VpnService { *; }
-keepclassmembers class * extends android.net.VpnService { *; }

# Keep Call Screening Service classes
-keep class * extends android.telecom.CallScreeningService { *; }
-keepclassmembers class * extends android.telecom.CallScreeningService { *; }

# Keep Kotlin Metadata for reflection
-keep class kotlin.Metadata { *; }
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault

# Keep AdMob classes if present
-keep class com.google.android.gms.ads.** { *; }

# Prevent obfuscation of native method names
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
