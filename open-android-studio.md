# 🚀 Building Shabari App with Android Studio

## **Step 1: Open Project in Android Studio**

1. **Launch Android Studio**
2. **Open Project:** 
   - Click "Open an Existing Project"
   - Navigate to: `C:\Users\Shubham prajapati\Downloads\Shabari-App-Final\Shabari\android`
   - Select the `android` folder and click "OK"

## **Step 2: Configure Project Settings**

### **Set Java Version:**
- Go to **File > Project Structure > Project**
- Set **Project SDK:** to **17** (should auto-detect)
- Set **Language Level:** to **17**

### **SDK Configuration:**
- Go to **File > Project Structure > SDK Location**
- **Android SDK Location:** `C:\Users\Shubham prajapati\AppData\Local\Android\Sdk`
- **JDK Location:** `C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot`

## **Step 3: Sync and Build**

1. **Sync Project:**
   - Click "Sync Project with Gradle Files" (🔄 icon in toolbar)
   - Wait for sync to complete

2. **Build APK:**
   - **Menu:** Build > Build Bundle(s) / APK(s) > Build APK(s)
   - **Or use the build button** (🔨 icon)

## **Step 4: Run on Device/Emulator**

### **Option A: Physical Device**
1. Enable **Developer Options** on your Android phone
2. Enable **USB Debugging**
3. Connect phone via USB
4. Click **Run** (▶️ button) in Android Studio

### **Option B: Emulator**
1. **Tools > AVD Manager**
2. Create/start an Android emulator
3. Click **Run** (▶️ button) and select emulator

## **Step 5: Build Configurations**

### **Available Build Types:**
- **debug:** Development build with debugging enabled
- **release:** Production build (requires signing)

### **To Switch Build Type:**
- **Build > Select Build Variant**
- Choose **app > debug** or **app > release**

## **Step 6: Generate Signed APK (Optional)**

1. **Build > Generate Signed Bundle / APK**
2. Choose **APK**
3. **Create new keystore** or use existing
4. Set keystore details and build

## **🔧 Fixes Applied:**

✅ **Java 17 Environment** - Properly configured  
✅ **C++ Linking** - Added `c++_shared` library to CMake files  
✅ **NDK Configuration** - Updated to NDK 27.1  
✅ **Gradle Configuration** - Optimized for React Native 0.79.4  

## **📱 Expected Build Output:**

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

## **🛠️ Troubleshooting:**

### **If Gradle Sync Fails:**
```bash
# In terminal:
cd android
./gradlew clean
```

### **If CMake Issues:**
- Go to **File > Invalidate Caches and Restart**
- Choose **Invalidate and Restart**

### **If Build Errors:**
- Check **Build > Build Output** window for detailed logs
- Look for red error messages and fix accordingly

## **💡 Advantages of Android Studio:**

1. **Better Error Messages** - Clearer C++ compilation errors
2. **Visual Debugging** - Step-through debugging capabilities  
3. **NDK Integration** - Better handling of native modules
4. **Gradle Control** - Fine-tuned build configurations
5. **Path Handling** - Better support for Windows paths with spaces

---

**🎯 Your project is now ready for Android Studio!**  
**Open the `android` folder in Android Studio and start building.** 