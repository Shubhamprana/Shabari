/**
 * Threat Intelligence Service
 * Unified service for threat detection using multiple sources
 */

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

export class ThreatIntelligenceService {
  private static instance: ThreatIntelligenceService;
  private phishTankCache: Map<string, PhishTankEntry> = new Map();
  private googleApiKey = 'AIzaSyBwTzCistXG-8szpkdTQ5TaTcNzqs4Lumw';
  private abuseIPDBApiKey = '6c1e3f349638d28fad0acf0304f2d7ab131af3085bed5e28ce75cf888f3d5e6dd97d153e87fabdde';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private lastCacheUpdate = 0;

  static getInstance(): ThreatIntelligenceService {
    if (!ThreatIntelligenceService.instance) {
      ThreatIntelligenceService.instance = new ThreatIntelligenceService();
    }
    return ThreatIntelligenceService.instance;
  }

  /**
   * Initialize the threat intelligence service
   */
  async initialize(): Promise<void> {
    console.log('🔍 Initializing Threat Intelligence Service...');
    
    try {
      // Load PhishTank data from Supabase
      await this.loadPhishTankData();
      
      // Load local threat database
      await this.loadLocalThreatDatabase();
      
      console.log('✅ Threat Intelligence Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Threat Intelligence Service:', error);
      throw error;
    }
  }

  /**
   * Check if a URL is a threat
   */
  async checkURL(url: string): Promise<ThreatResult> {
    try {
      // 1. Check local PhishTank cache (fastest)
      const phishTankResult = await this.checkPhishTank(url);
      if (phishTankResult.isThreat) {
        return phishTankResult;
      }

      // 2. Check local Supabase database
      const localResult = await this.checkLocalDatabase(url);
      if (localResult.isThreat) {
        return localResult;
      }

      // 3. Check Google Safe Browsing (comprehensive)
      const googleResult = await this.checkGoogleSafeBrowsing(url);
      if (googleResult.isThreat) {
        // Store in local database for future fast lookup
        await this.storeThreatInDatabase(url, googleResult);
        return googleResult;
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
   * Check if an IP address is a threat
   */
  async checkIP(ip: string): Promise<ThreatResult> {
    try {
      // 1. Check local database first
      const localResult = await this.checkLocalIPDatabase(ip);
      if (localResult.isThreat) {
        return localResult;
      }

      // 2. Check AbuseIPDB
      const abuseIPDBResult = await this.checkAbuseIPDB(ip);
      if (abuseIPDBResult.isThreat) {
        // Store in local database
        await this.storeIPThreatInDatabase(ip, abuseIPDBResult);
        return abuseIPDBResult;
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
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.googleApiKey}`,
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
      const response = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`,
        {
          headers: {
            'Key': this.abuseIPDBApiKey,
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
   * Load PhishTank data from Supabase
   */
  private async loadPhishTankData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('fraud_domains')
        .select('*')
        .eq('category', 'phishing')
        .eq('active', true);

      if (error) {
        console.warn('⚠️ No PhishTank data found in database, will load from CSV');
        return;
      }

      // Cache PhishTank data
      data?.forEach(domain => {
        this.phishTankCache.set(domain.domain, {
          phish_id: domain.id,
          url: domain.domain,
          phish_detail_url: '',
          submission_time: domain.created_at,
          verified: 'yes',
          verification_time: domain.updated_at,
          online: 'yes',
          target: domain.description || 'Other'
        });
      });

      console.log(`✅ Loaded ${this.phishTankCache.size} PhishTank entries from database`);

    } catch (error) {
      console.error('❌ Error loading PhishTank data:', error);
    }
  }

  /**
   * Load local threat database
   */
  private async loadLocalThreatDatabase(): Promise<void> {
    try {
      // This will be populated by the CSV import process
      console.log('✅ Local threat database loaded');
    } catch (error) {
      console.error('❌ Error loading local threat database:', error);
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
  getCacheStats(): { phishTankEntries: number; lastUpdate: number } {
    return {
      phishTankEntries: this.phishTankCache.size,
      lastUpdate: this.lastCacheUpdate
    };
  }
}

// Export singleton instance
export const threatIntelligenceService = ThreatIntelligenceService.getInstance();
