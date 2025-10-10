 /**
 * Local Threat Detection Service
 * Uses local CSV data and APIs for threat detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface ThreatResult {
  isThreat: boolean;
  confidence: number;
  threatType: 'phishing' | 'malware' | 'scam' | 'spam' | 'unknown';
  source: 'local' | 'google' | 'abuseipdb' | 'phishtank';
  details?: string;
  target?: string;
  severity: number; // 0-100
}

export interface PhishTankEntry {
  phish_id: string;
  url: string;
  phish_detail_url: string;
  submission_time: string;
  verified: string;
  verification_time: string;
  online: string;
  target: string;
}

export interface ThreatDetectionSettings {
  enablePhishTank: boolean;
  enableGoogleSafeBrowsing: boolean;
  enableAbuseIPDB: boolean;
  enableLocalDatabase: boolean;
  threatSensitivity: number; // 0-100
  autoBlockThreats: boolean;
  showThreatWarnings: boolean;
  maxApiCallsPerDay: number;
  customApiKeys: {
    googleSafeBrowsing: string;
    abuseIPDB: string;
  };
}

export class LocalThreatDetectionService {
  private static instance: LocalThreatDetectionService;
  private phishTankCache: Map<string, PhishTankEntry> = new Map();
  private googleApiKey = 'AIzaSyBwTzCistXG-8szpkdTQ5TaTcNzqs4Lumw';
  private abuseIPDBApiKey = '6c1e3f349638d28fad0acf0304f2d7ab131af3085bed5e28ce75cf888f3d5e6dd97d153e87fabdde';
  private isInitialized = false;
  private settings: ThreatDetectionSettings | null = null;
  private apiCallCount = 0;
  private lastApiResetDate = new Date().toDateString();

  static getInstance(): LocalThreatDetectionService {
    if (!LocalThreatDetectionService.instance) {
      LocalThreatDetectionService.instance = new LocalThreatDetectionService();
    }
    return LocalThreatDetectionService.instance;
  }

  /**
   * Initialize the service with PhishTank data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔍 Initializing Local Threat Detection Service...');
    
    try {
      // Load user settings
      await this.loadSettings();
      
      // Load PhishTank data from local CSV
      await this.loadPhishTankData();
      
      this.isInitialized = true;
      console.log('✅ Local Threat Detection Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Local Threat Detection Service:', error);
      throw error;
    }
  }

  /**
   * Load user settings from AsyncStorage
   */
  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('threatDetectionSettings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
        console.log('✅ Threat detection settings loaded');
      } else {
        // Use default settings
        this.settings = {
          enablePhishTank: true,
          enableGoogleSafeBrowsing: true,
          enableAbuseIPDB: true,
          enableLocalDatabase: true,
          threatSensitivity: 75,
          autoBlockThreats: false,
          showThreatWarnings: true,
          maxApiCallsPerDay: 1000,
          customApiKeys: {
            googleSafeBrowsing: this.googleApiKey,
            abuseIPDB: this.abuseIPDBApiKey
          }
        };
        console.log('✅ Using default threat detection settings');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      // Use default settings on error
      this.settings = {
        enablePhishTank: true,
        enableGoogleSafeBrowsing: true,
        enableAbuseIPDB: true,
        enableLocalDatabase: true,
        threatSensitivity: 75,
        autoBlockThreats: false,
        showThreatWarnings: true,
        maxApiCallsPerDay: 1000,
        customApiKeys: {
          googleSafeBrowsing: this.googleApiKey,
          abuseIPDB: this.abuseIPDBApiKey
        }
      };
    }
  }

  /**
   * Get current settings
   */
  getSettings(): ThreatDetectionSettings | null {
    return this.settings;
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings: ThreatDetectionSettings): Promise<void> {
    try {
      this.settings = newSettings;
      await AsyncStorage.setItem('threatDetectionSettings', JSON.stringify(newSettings));
      console.log('✅ Threat detection settings updated');
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Check if API calls are within daily limit
   */
  private checkApiLimit(): boolean {
    if (!this.settings) return true;

    const today = new Date().toDateString();
    if (today !== this.lastApiResetDate) {
      // Reset counter for new day
      this.apiCallCount = 0;
      this.lastApiResetDate = today;
    }

    return this.apiCallCount < this.settings.maxApiCallsPerDay;
  }

  /**
   * Increment API call counter
   */
  private incrementApiCallCount(): void {
    this.apiCallCount++;
  }

  /**
   * Check if a URL is a threat
   */
  async checkURL(url: string): Promise<ThreatResult> {
    try {
      if (!this.settings) {
        console.warn('⚠️ Settings not loaded, using default behavior');
        return this.checkURLWithDefaults(url);
      }

      // 1. Check local PhishTank cache (fastest) - if enabled
      if (this.settings.enablePhishTank) {
        const phishTankResult = await this.checkPhishTank(url);
        if (phishTankResult.isThreat) {
          return this.applySensitivityFilter(phishTankResult);
        }
      }

      // 2. Check local Supabase database - if enabled
      if (this.settings.enableLocalDatabase) {
        const localResult = await this.checkLocalDatabase(url);
        if (localResult.isThreat) {
          return this.applySensitivityFilter(localResult);
        }
      }

      // 3. Check Google Safe Browsing (comprehensive) - if enabled and within API limit
      if (this.settings.enableGoogleSafeBrowsing && this.checkApiLimit()) {
        const googleResult = await this.checkGoogleSafeBrowsing(url);
        this.incrementApiCallCount();
        
        if (googleResult.isThreat) {
          // Store in local database for future fast lookup
          if (this.settings.enableLocalDatabase) {
            await this.storeThreatInDatabase(url, googleResult);
          }
          return this.applySensitivityFilter(googleResult);
        }
      }

      // 4. If no threat found, return safe result
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };

    } catch (error) {
      console.error('❌ Error checking URL:', error);
      // Return safe result on error to avoid blocking legitimate traffic
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };
    }
  }

  /**
   * Check URL with default settings (fallback)
   */
  private async checkURLWithDefaults(url: string): Promise<ThreatResult> {
    // Use default behavior when settings are not available
    const phishTankResult = await this.checkPhishTank(url);
    if (phishTankResult.isThreat) {
      return phishTankResult;
    }

    const localResult = await this.checkLocalDatabase(url);
    if (localResult.isThreat) {
      return localResult;
    }

    return {
      isThreat: false,
      confidence: 0,
      threatType: 'unknown',
      source: 'local',
      severity: 0
    };
  }

  /**
   * Apply sensitivity filter to threat result
   */
  private applySensitivityFilter(result: ThreatResult): ThreatResult {
    if (!this.settings || !result.isThreat) {
      return result;
    }

    // If threat severity is below sensitivity threshold, mark as safe
    if (result.severity < this.settings.threatSensitivity) {
      return {
        ...result,
        isThreat: false,
        confidence: Math.max(0, result.confidence - (this.settings.threatSensitivity - result.severity))
      };
    }

    return result;
  }

  /**
   * Check if an IP address is a threat
   */
  async checkIP(ip: string): Promise<ThreatResult> {
    try {
      if (!this.settings) {
        console.warn('⚠️ Settings not loaded, using default behavior');
        return this.checkIPWithDefaults(ip);
      }

      // 1. Check local database first - if enabled
      if (this.settings.enableLocalDatabase) {
        const localResult = await this.checkLocalIPDatabase(ip);
        if (localResult.isThreat) {
          return this.applySensitivityFilter(localResult);
        }
      }

      // 2. Check AbuseIPDB - if enabled and within API limit
      if (this.settings.enableAbuseIPDB && this.checkApiLimit()) {
        const abuseIPDBResult = await this.checkAbuseIPDB(ip);
        this.incrementApiCallCount();
        
        if (abuseIPDBResult.isThreat) {
          // Store in local database for future fast lookup
          if (this.settings.enableLocalDatabase) {
            await this.storeIPThreatInDatabase(ip, abuseIPDBResult);
          }
          return this.applySensitivityFilter(abuseIPDBResult);
        }
      }

      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };

    } catch (error) {
      console.error('❌ Error checking IP:', error);
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };
    }
  }

  /**
   * Check IP with default settings (fallback)
   */
  private async checkIPWithDefaults(ip: string): Promise<ThreatResult> {
    // Use default behavior when settings are not available
    const localResult = await this.checkLocalIPDatabase(ip);
    if (localResult.isThreat) {
      return localResult;
    }

    return {
      isThreat: false,
      confidence: 0,
      threatType: 'unknown',
      source: 'local',
      severity: 0
    };
  }

  /**
   * Load PhishTank data from local CSV
   */
  private async loadPhishTankData(): Promise<void> {
    try {
      // For React Native, we'll create a pre-processed JSON file
      // This is more efficient than parsing CSV at runtime
      const phishTankData = await this.loadPhishTankJSON();
      
      if (phishTankData && phishTankData.length > 0) {
        phishTankData.forEach(entry => {
          this.phishTankCache.set(entry.url, entry);
        });
        console.log(`✅ Loaded ${this.phishTankCache.size} PhishTank entries from local data`);
      } else {
        console.warn('⚠️ No PhishTank data loaded');
      }

    } catch (error) {
      console.error('❌ Error loading PhishTank data:', error);
    }
  }

  /**
   * Load PhishTank data from JSON file (pre-processed from CSV)
   */
  private async loadPhishTankJSON(): Promise<PhishTankEntry[]> {
    try {
      // Load from the converted JSON file
      // In React Native, you would typically bundle this as an asset
      // For now, we'll use a require statement for the sample data
      
      const phishTankData = require('../data/phishtank-sample.json');
      
      if (phishTankData && phishTankData.entries) {
        console.log(`📊 Loaded ${phishTankData.entries.length} PhishTank entries from JSON`);
        console.log(`📋 Categories: ${Object.keys(phishTankData.categories).join(', ')}`);
        return phishTankData.entries;
      }

      // Fallback to sample data if JSON loading fails
      const sampleData: PhishTankEntry[] = [
        {
          phish_id: '9204890',
          url: 'https://qat-102480.weeblysite.com/',
          phish_detail_url: 'http://www.phishtank.com/phish_detail.php?phish_id=9204890',
          submission_time: '2025-09-07T09:51:07+00:00',
          verified: 'yes',
          verification_time: '2025-09-07T10:02:59+00:00',
          online: 'yes',
          target: 'Other'
        },
        {
          phish_id: '9204885',
          url: 'https://sso--en--coinbasepro--cdn--m--auth.webflow.io/',
          phish_detail_url: 'http://www.phishtank.com/phish_detail.php?phish_id=9204885',
          submission_time: '2025-09-07T09:42:50+00:00',
          verified: 'yes',
          verification_time: '2025-09-07T09:51:39+00:00',
          online: 'yes',
          target: 'Coinbase'
        }
      ];

      console.log(`📊 Using fallback sample data: ${sampleData.length} entries`);
      return sampleData;

    } catch (error) {
      console.error('❌ Error loading PhishTank JSON:', error);
      
      // Return minimal fallback data
      return [
        {
          phish_id: '9204885',
          url: 'https://sso--en--coinbasepro--cdn--m--auth.webflow.io/',
          phish_detail_url: 'http://www.phishtank.com/phish_detail.php?phish_id=9204885',
          submission_time: '2025-09-07T09:42:50+00:00',
          verified: 'yes',
          verification_time: '2025-09-07T09:51:39+00:00',
          online: 'yes',
          target: 'Coinbase'
        }
      ];
    }
  }

  /**
   * Check PhishTank cache for URL
   */
  private async checkPhishTank(url: string): Promise<ThreatResult> {
    const domain = this.extractDomain(url);
    
    // Check exact URL match
    if (this.phishTankCache.has(url)) {
      const entry = this.phishTankCache.get(url)!;
      return {
        isThreat: true,
        confidence: 100,
        threatType: 'phishing',
        source: 'phishtank',
        details: `PhishTank ID: ${entry.phish_id}`,
        target: entry.target,
        severity: 95
      };
    }

    // Check domain match
    for (const [cachedUrl, entry] of this.phishTankCache) {
      if (this.extractDomain(cachedUrl) === domain) {
        return {
          isThreat: true,
          confidence: 90,
          threatType: 'phishing',
          source: 'phishtank',
          details: `PhishTank ID: ${entry.phish_id} (domain match)`,
          target: entry.target,
          severity: 90
        };
      }
    }

    return {
      isThreat: false,
      confidence: 0,
      threatType: 'unknown',
      source: 'phishtank',
      severity: 0
    };
  }

  /**
   * Check Google Safe Browsing API
   */
  private async checkGoogleSafeBrowsing(url: string): Promise<ThreatResult> {
    try {
      // Use custom API key from settings if available
      const apiKey = this.settings?.customApiKeys?.googleSafeBrowsing || this.googleApiKey;
      
      const requestBody = {
        client: {
          clientId: 'shabari-app',
          clientVersion: '1.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      };

      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Safe Browsing API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.matches && data.matches.length > 0) {
        const match = data.matches[0];
        return {
          isThreat: true,
          confidence: 95,
          threatType: this.mapGoogleThreatType(match.threatType),
          source: 'google',
          details: `Google Safe Browsing: ${match.threatType}`,
          severity: 95
        };
      }

      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'google',
        severity: 0
      };

    } catch (error) {
      console.error('❌ Google Safe Browsing API error:', error);
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'google',
        severity: 0
      };
    }
  }

  /**
   * Check AbuseIPDB API
   */
  private async checkAbuseIPDB(ip: string): Promise<ThreatResult> {
    try {
      // Use custom API key from settings if available
      const apiKey = this.settings?.customApiKeys?.abuseIPDB || this.abuseIPDBApiKey;
      
      const response = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`,
        {
          headers: {
            'Key': apiKey,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`AbuseIPDB API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.abuseConfidencePercentage > 0) {
        const confidence = data.data.abuseConfidencePercentage;
        return {
          isThreat: confidence > 25,
          confidence: confidence,
          threatType: 'malware',
          source: 'abuseipdb',
          details: `AbuseIPDB confidence: ${confidence}%`,
          severity: Math.min(confidence, 100)
        };
      }

      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'abuseipdb',
        severity: 0
      };

    } catch (error) {
      console.error('❌ AbuseIPDB API error:', error);
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'abuseipdb',
        severity: 0
      };
    }
  }

  /**
   * Check local Supabase database
   */
  private async checkLocalDatabase(url: string): Promise<ThreatResult> {
    try {
      const domain = this.extractDomain(url);
      
      // Check fraud_domains table
      const { data: domainData, error: domainError } = await supabase
        .from('fraud_domains')
        .select('*')
        .eq('domain', domain)
        .eq('active', true)
        .single();

      if (!domainError && domainData) {
        return {
          isThreat: true,
          confidence: domainData.severity,
          threatType: domainData.category as any,
          source: 'local',
          details: domainData.description,
          severity: domainData.severity
        };
      }

      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };

    } catch (error) {
      console.error('❌ Local database check error:', error);
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };
    }
  }

  /**
   * Check local IP database
   */
  private async checkLocalIPDatabase(ip: string): Promise<ThreatResult> {
    try {
      const { data, error } = await supabase
        .from('fraud_ips')
        .select('*')
        .eq('range', ip)
        .eq('active', true)
        .single();

      if (!error && data) {
        return {
          isThreat: true,
          confidence: data.severity,
          threatType: data.category as any,
          source: 'local',
          details: data.description,
          severity: data.severity
        };
      }

      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };

    } catch (error) {
      console.error('❌ Local IP database check error:', error);
      return {
        isThreat: false,
        confidence: 0,
        threatType: 'unknown',
        source: 'local',
        severity: 0
      };
    }
  }

  /**
   * Store threat in local database
   */
  private async storeThreatInDatabase(url: string, result: ThreatResult): Promise<void> {
    try {
      const domain = this.extractDomain(url);
      
      await supabase
        .from('fraud_domains')
        .upsert({
          domain: domain,
          type: 'domain',
          category: result.threatType,
          severity: result.severity,
          active: true,
          description: result.details,
          report_count: 1,
          metadata: {
            source: result.source,
            original_url: url,
            confidence: result.confidence
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('❌ Error storing threat in database:', error);
    }
  }

  /**
   * Store IP threat in local database
   */
  private async storeIPThreatInDatabase(ip: string, result: ThreatResult): Promise<void> {
    try {
      await supabase
        .from('fraud_ips')
        .upsert({
          range: ip,
          type: 'ip',
          category: result.threatType,
          severity: result.severity,
          active: true,
          description: result.details,
          report_count: 1,
          metadata: {
            source: result.source,
            confidence: result.confidence
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('❌ Error storing IP threat in database:', error);
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Map Google threat type to our threat type
   */
  private mapGoogleThreatType(googleType: string): 'phishing' | 'malware' | 'scam' | 'spam' | 'unknown' {
    switch (googleType) {
      case 'SOCIAL_ENGINEERING':
        return 'phishing';
      case 'MALWARE':
        return 'malware';
      case 'UNWANTED_SOFTWARE':
        return 'spam';
      default:
        return 'unknown';
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { phishTankEntries: number; isInitialized: boolean } {
    return {
      phishTankEntries: this.phishTankCache.size,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const localThreatDetectionService = LocalThreatDetectionService.getInstance();
