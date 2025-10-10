# 🔒 Security Setup Guide - Quick Start

## **IMMEDIATE ACTION REQUIRED**

Before deploying to production, you MUST configure secure credentials. Follow these steps:

---

## 📋 **Step 1: Set Supabase Credentials**

### **Option A: Environment Variables (Recommended for EAS)**

Add to your `.env` file (create if doesn't exist):

```env
SUPABASE_URL=https://mynbtxrbqbmhxvaimfhs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJ0eHJicWJtaHh2YWltZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI1NzEsImV4cCI6MjA2NTQwODU3MX0.c8K9g6NsT3MjYMcQYiSAzP8Tb05OYzY5WPHPrq-HJL0
```

Then update `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        // ... existing config ...

        // Add BuildConfig fields
        buildConfigField "String", "SUPABASE_URL", "\"${System.getenv('SUPABASE_URL') ?: project.findProperty('SUPABASE_URL') ?: ''}\""
        buildConfigField "String", "SUPABASE_ANON_KEY", "\"${System.getenv('SUPABASE_ANON_KEY') ?: project.findProperty('SUPABASE_ANON_KEY') ?: ''}\""
    }
}
```

### **Option B: Android Resources (Alternative)**

Create `android/app/src/main/res/values/secrets.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="supabase_url">https://mynbtxrbqbmhxvaimfhs.supabase.co</string>
    <string name="supabase_anon_key">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJ0eHJicWJtaHh2YWltZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI1NzEsImV4cCI6MjA2NTQwODU3MX0.c8K9g6NsT3MjYMcQYiSAzP8Tb05OYzY5WPHPrq-HJL0</string>
</resources>
```

---

## 📋 **Step 2: Update .gitignore**

**CRITICAL:** Prevent committing secrets to git!

Add to `.gitignore`:

```gitignore
# Secrets and credentials
.env
.env.local
.env.production
.env.*.local
android/app/src/main/res/values/secrets.xml

# Supabase config
**/supabase-config.json

# Google Services
google-services.json
```

---

## 📋 **Step 3: Get Certificate Hashes**

Run this command to get Supabase certificate hash:

```bash
echo | openssl s_client -connect mynbtxrbqbmhxvaimfhs.supabase.co:443 2>/dev/null | \
openssl x509 -pubkey -noout | \
openssl pkey -pubin -outform der | \
openssl dgst -sha256 -binary | \
openssl enc -base64
```

Then update `SupabasePhoneService.kt` line 63:

```kotlin
private val certificatePinner = CertificatePinner.Builder()
    .add("*.supabase.co", "sha256/YOUR_ACTUAL_CERT_HASH_HERE")
    .build()
```

---

## 📋 **Step 4: Change HMAC Secret Key**

**CRITICAL:** Replace placeholder secret!

In `FilterEngine.kt` line 550, change:

```kotlin
// BEFORE (INSECURE)
val secretKey = "CHANGE_ME_IN_PRODUCTION_USE_KEYSTORE"

// AFTER (Use a strong random key)
val secretKey = generateSecretKey() // Implement this
// OR load from Android Keystore
```

### **Recommended: Use Android Keystore**

Add this method to `FilterEngine.kt`:

```kotlin
private fun getOrCreateSecretKey(): String {
    val keyStore = KeyStore.getInstance("AndroidKeyStore")
    keyStore.load(null)

    val alias = "shabari_hmac_key"

    if (!keyStore.containsAlias(alias)) {
        // Generate new key
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_HMAC_SHA256,
            "AndroidKeyStore"
        )

        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_SIGN
        ).build()

        keyGenerator.init(spec)
        keyGenerator.generateKey()
    }

    val entry = keyStore.getEntry(alias, null) as KeyStore.SecretKeyEntry
    return Base64.encodeToString(entry.secretKey.encoded, Base64.NO_WRAP)
}
```

---

## 📋 **Step 5: Test Security Fixes**

### **Test 1: Rate Limiting**

```bash
# Should block after 60 requests
for i in {1..65}; do
  echo "Request $i"
  # Make API call here
done
```

### **Test 2: Input Validation**

Try these invalid inputs - should be rejected:
- Empty phone number: `""`
- Too short: `"123"`
- Too long: `"12345678901234567890123"`
- Invalid domain: `"..bad-domain.."`
- Oversized DNS packet: `[10000 bytes]`

### **Test 3: Credential Security**

```bash
# Verify secrets NOT in APK
unzip -l app-release.apk | grep -i "supabase"
# Should return no results

# Check BuildConfig
javap -c app/build/BuildConfig.class | grep -i "supabase"
# Should show only references, not values
```

---

## 📋 **Step 6: For EAS Build**

Add secrets to EAS:

```bash
eas secret:create --scope project --name SUPABASE_URL --value "https://mynbtxrbqbmhxvaimfhs.supabase.co" --type string

eas secret:create --scope project --name SUPABASE_ANON_KEY --value "your-anon-key-here" --type string
```

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

---

## ✅ **Verification Checklist**

Before production deployment:

- [ ] Secrets moved out of source code
- [ ] `.gitignore` updated
- [ ] Certificate pinning configured
- [ ] HMAC secret key changed
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] APK scanned for secrets (should find none)
- [ ] EAS secrets configured (if using EAS)
- [ ] Local build works with new config
- [ ] Production build tested on device

---

## 🚨 **If You Already Committed Secrets**

If you accidentally committed secrets to git:

1. **Rotate credentials immediately:**
   - Generate new Supabase anon key
   - Update all references

2. **Remove from git history:**
   ```bash
   # Use BFG Repo-Cleaner
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push (CAUTION):**
   ```bash
   git push --force
   ```

---

## 📞 **Need Help?**

- Review: `PROXY_ENGINE_SECURITY_FIXES.md`
- Check: Android Keystore docs
- Supabase: https://supabase.com/docs

---

**REMEMBER:** Never commit API keys, passwords, or secrets to version control!
