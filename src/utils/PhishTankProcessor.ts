/**
 * PhishTank CSV Processor
 * Processes and imports PhishTank CSV data to Supabase
 */

import { supabase } from '../lib/supabase';
import { PhishTankEntry } from '../services/ThreatIntelligenceService';

export class PhishTankProcessor {
  /**
   * Parse CSV content and return PhishTank entries
   */
  static parseCSV(csvContent: string): PhishTankEntry[] {
    const lines = csvContent.split('\n');
    const entries: PhishTankEntry[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const entry = this.parseCSVLine(line);
        if (entry) {
          entries.push(entry);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse line ${i}:`, error);
      }
    }

    return entries;
  }

  /**
   * Parse a single CSV line
   */
  private static parseCSVLine(line: string): PhishTankEntry | null {
    // Handle CSV parsing with proper escaping
    const fields = this.parseCSVFields(line);
    
    if (fields.length < 8) {
      return null;
    }

    return {
      phish_id: fields[0],
      url: fields[1],
      phish_detail_url: fields[2],
      submission_time: fields[3],
      verified: fields[4],
      verification_time: fields[5],
      online: fields[6],
      target: fields[7]
    };
  }

  /**
   * Parse CSV fields with proper handling of quoted values
   */
  private static parseCSVFields(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    fields.push(current.trim());

    return fields;
  }

  /**
   * Import PhishTank entries to Supabase
   */
  static async importToSupabase(entries: PhishTankEntry[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(`🔄 Importing ${entries.length} PhishTank entries to Supabase...`);

    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.processBatch(batch);
        success += batchResults.success;
        failed += batchResults.failed;
        
        console.log(`📊 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)}: ${batchResults.success} success, ${batchResults.failed} failed`);
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        failed += batch.length;
      }
    }

    console.log(`✅ Import complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Process a batch of entries
   */
  private static async processBatch(entries: PhishTankEntry[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.importEntry(entry);
        success++;
      } catch (error) {
        console.warn(`⚠️ Failed to import entry ${entry.phish_id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Import a single PhishTank entry
   */
  private static async importEntry(entry: PhishTankEntry): Promise<void> {
    try {
      // Extract domain from URL
      const domain = this.extractDomain(entry.url);
      if (!domain) {
        throw new Error('Invalid URL');
      }

      // Determine threat category based on target
      const category = this.mapTargetToCategory(entry.target);

      // Calculate severity based on target importance
      const severity = this.calculateSeverity(entry.target);

      // Import to fraud_domains table
      const { error } = await supabase
        .from('fraud_domains')
        .upsert({
          domain: domain,
          type: 'domain',
          category: category,
          severity: severity,
          active: true,
          description: `PhishTank verified phishing site targeting ${entry.target}`,
          report_count: 1,
          block_count: 0,
          warn_count: 0,
          first_reported: Date.now(),
          last_reported: Date.now(),
          reporters: ['phishtank'],
          metadata: {
            source: 'phishtank',
            phish_id: entry.phish_id,
            phish_detail_url: entry.phish_detail_url,
            submission_time: entry.submission_time,
            verification_time: entry.verification_time,
            target: entry.target,
            verified: entry.verified === 'yes',
            online: entry.online === 'yes'
          },
          reviewed: true,
          reviewed_by: null,
          reviewed_at: new Date().toISOString(),
          review_decision: 'approved',
          review_notes: 'Imported from PhishTank verified database',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

    } catch (error) {
      throw new Error(`Import failed: ${error}`);
    }
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Map target to threat category
   */
  private static mapTargetToCategory(target: string): string {
    const targetLower = target.toLowerCase();
    
    if (targetLower.includes('coinbase') || targetLower.includes('crypto') || targetLower.includes('bitcoin')) {
      return 'crypto_phishing';
    } else if (targetLower.includes('microsoft') || targetLower.includes('office') || targetLower.includes('outlook')) {
      return 'microsoft_phishing';
    } else if (targetLower.includes('apple') || targetLower.includes('icloud') || targetLower.includes('iphone')) {
      return 'apple_phishing';
    } else if (targetLower.includes('google') || targetLower.includes('gmail') || targetLower.includes('youtube')) {
      return 'google_phishing';
    } else if (targetLower.includes('facebook') || targetLower.includes('instagram') || targetLower.includes('whatsapp')) {
      return 'social_phishing';
    } else if (targetLower.includes('bank') || targetLower.includes('paypal') || targetLower.includes('payment')) {
      return 'financial_phishing';
    } else if (targetLower.includes('amazon') || targetLower.includes('ebay') || targetLower.includes('allegro')) {
      return 'ecommerce_phishing';
    } else {
      return 'phishing';
    }
  }

  /**
   * Calculate severity based on target
   */
  private static calculateSeverity(target: string): number {
    const targetLower = target.toLowerCase();
    
    // High-value targets get higher severity
    if (targetLower.includes('coinbase') || targetLower.includes('crypto')) {
      return 95;
    } else if (targetLower.includes('microsoft') || targetLower.includes('apple') || targetLower.includes('google')) {
      return 90;
    } else if (targetLower.includes('bank') || targetLower.includes('paypal')) {
      return 85;
    } else if (targetLower.includes('amazon') || targetLower.includes('facebook')) {
      return 80;
    } else {
      return 75;
    }
  }

  /**
   * Get import statistics
   */
  static async getImportStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
    try {
      const { data, error } = await supabase
        .from('fraud_domains')
        .select('category')
        .eq('metadata->>source', 'phishtank');

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        byCategory: {} as Record<string, number>
      };

      data?.forEach(entry => {
        const category = entry.category || 'unknown';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('❌ Error getting import stats:', error);
      return { total: 0, byCategory: {} };
    }
  }

  /**
   * Clean up old PhishTank entries
   */
  static async cleanupOldEntries(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('fraud_domains')
        .delete()
        .eq('metadata->>source', 'phishtank')
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;

    } catch (error) {
      console.error('❌ Error cleaning up old entries:', error);
      return 0;
    }
  }
}
