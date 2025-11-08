# Get Crash Logs from Your Phone

## Method 1: Using ADB (Recommended)

### Install ADB:
1. Download Android Platform Tools: https://developer.android.com/studio/releases/platform-tools
2. Extract to `C:\platform-tools`

### Get Logs:
```bash
# Connect phone via USB (enable USB debugging)
cd C:\platform-tools

# Check device connected
.\adb devices

# Clear old logs
.\adb logcat -c

# Open the app on your phone (it will crash)

# Get crash logs
.\adb logcat > C:\Shabari\crash_log.txt

# Press Ctrl+C after 10 seconds
```

## Method 2: Using Phone Settings

1. Open **Settings** → **About Phone**
2. Tap **Build Number** 7 times (enables Developer Mode)
3. Go to **Developer Options**
4. Enable **USB Debugging**
5. Follow Method 1

## Method 3: LogCat Reader App

1. Install **LogCat Reader** from Play Store
2. Open the Shabari app (let it crash)
3. Open LogCat Reader
4. Find errors (usually marked in red)
5. Share the logs

## What to Look For:

Search for these in logs:
- `FATAL EXCEPTION`
- `AndroidRuntime`
- `com.shabari.app`
- `Caused by:`

