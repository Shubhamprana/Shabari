# 🚀 Quick Testing Guide - Shabari App

## 📱 Two Build Types Explained

### 1️⃣ **Production Build** (Currently Building)
- **Use for:** Final testing, Play Store submission
- **Rebuild when:** You need a release-ready APK
- **Command:** `npx eas build -p android --profile production`
- **Features:** Optimized, minified, production-ready

### 2️⃣ **Development Build** (Currently Building)
- **Use for:** Daily development and quick testing
- **Rebuild:** Only when you change native code or dependencies
- **Features:** Hot reload, fast refresh, instant updates

---

## 🎯 How to Use Development Build for Quick Testing

### Step 1: Install the Development APK (One Time)
Once the development build completes:
1. Download the APK from EAS
2. Install it on your device
3. **Keep this app installed** - you'll reuse it!

### Step 2: Start Metro Bundler
Open terminal in your project directory:
```bash
npx expo start --dev-client
```

### Step 3: Connect Your Device
The development app will automatically connect to your Metro bundler:
- **Same WiFi:** App auto-detects your computer
- **USB:** Use `adb reverse tcp:8081 tcp:8081`
- **Manual:** Enter your computer's IP in the app

### Step 4: Make Changes and See Them INSTANTLY! ⚡
1. Edit any `.tsx`, `.ts`, or `.js` file
2. Save the file
3. **Changes appear in < 1 second** on your device!
4. No rebuild needed! 🎉

---

## 🔄 When to Rebuild Each Type

### Development Build - Rebuild Only When:
- ✅ You install/remove npm packages
- ✅ You change `app.config.js`
- ✅ You modify native Android code
- ✅ You update ProGuard rules
- ❌ **NOT needed** for UI changes, logic updates, or most code changes

### Production Build - Rebuild When:
- ✅ Ready for final testing
- ✅ Submitting to Play Store
- ✅ Need optimized performance testing
- ✅ Testing ProGuard/R8 optimizations

---

## 📊 Current Build Status

### Production Build
**Status:** 🔄 Building now...
**Purpose:** Final production APK with all fixes
**Download:** Check EAS dashboard when complete

### Development Build
**Status:** 🔄 Building now...
**Purpose:** Your daily testing companion
**Download:** Install once, reuse forever!

---

## 💡 Quick Commands Reference

### Start Development Server
```bash
npx expo start --dev-client
```

### Build Production APK
```bash
npx eas build -p android --profile production
```

### Build Development APK (Rarely Needed)
```bash
npx eas build -p android --profile development
```

### Check Build Status
```bash
npx eas build:list --limit 5
```

---

## 🎨 What You Can Test Without Rebuilding

With the development build installed, you can test:
- ✅ All UI changes
- ✅ Component updates
- ✅ Logic modifications
- ✅ Service changes
- ✅ API integrations
- ✅ State management
- ✅ Navigation flow
- ✅ Style changes
- ✅ New features (if no new dependencies)

---

## ⚠️ Important Notes

1. **Development APK is NOT for Play Store**
   - It's a debug build
   - Larger file size
   - Includes development tools

2. **Production APK is optimized**
   - Smaller size
   - Better performance
   - No debug tools

3. **Best Practice**
   - Use development build for 95% of testing
   - Use production build for final verification

---

## 🎯 Typical Development Workflow

```
Day 1:
├── Build development APK (20 minutes)
└── Install on device (once)

Day 1-30:
├── npx expo start --dev-client
├── Make code changes
├── Test instantly (< 1 second)
├── Iterate quickly
└── No rebuilding! 🎉

Final Day:
├── Build production APK
└── Final testing + Play Store submission
```

---

## 📞 Quick Help

**Metro bundler not connecting?**
```bash
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client --tunnel
```

**Changes not appearing?**
- Press `R` in terminal to reload
- Or shake device and press "Reload"

**Need fresh start?**
```bash
npx expo start --dev-client --clear
```

---

## ✅ Both Builds Are Now Running

**Estimated time:** 15-20 minutes each

**You'll receive:**
1. **Production APK** - For final testing
2. **Development APK** - For daily testing (install this one!)

**Once development APK is installed:**
```bash
npx expo start --dev-client
```
**And you're ready to test changes instantly!** ⚡

