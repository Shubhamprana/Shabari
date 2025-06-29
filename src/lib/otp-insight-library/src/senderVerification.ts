import dltDataJson from '../assets/trusted_dlt_headers.json';

export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK_FORGERY';

export interface SenderVerificationResult {
  riskLevel: RiskLevel;
  details: {
    missingHeader: boolean;
    badURL: boolean;
    isTenDigitNumber: boolean;
    unlistedAlphanumeric: boolean;
  };
}

interface DLTData {
  dlt_headers: string[];
  whitelisted_domains: string[];
  url_shorteners: string[];
}

const dltData: DLTData = dltDataJson as DLTData;

export class SenderVerificationService {
  private dltHeaders: Set<string>;
  private whitelistedDomains: Set<string>;
  private urlShorteners: Set<string>;

  constructor() {
    this.dltHeaders = new Set(dltData.dlt_headers);
    this.whitelistedDomains = new Set(dltData.whitelisted_domains);
    this.urlShorteners = new Set(dltData.url_shorteners);
  }

  public verifySender(senderId: string, messageText: string): SenderVerificationResult {
    let riskLevel: RiskLevel = 'SAFE';
    const details = {
      missingHeader: false,
      badURL: false,
      isTenDigitNumber: false,
      unlistedAlphanumeric: false,
    };

    // Special handling for manual/app analysis (not from SMS)
    const isManualAnalysis = senderId === 'UNKNOWN_APP' || senderId === 'MANUAL_INPUT' || senderId === 'USER_INPUT';
    
    if (isManualAnalysis) {
      // For manual analysis, be much more conservative
      // Only flag if there are explicit fraud indicators in the message itself
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlsInMessage = messageText.match(urlRegex);

      if (urlsInMessage) {
        for (const url of urlsInMessage) {
          try {
            const hostname = new URL(url).hostname;
            const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

            if (this.urlShorteners.has(domain)) {
              details.badURL = true;
              riskLevel = 'HIGH_RISK_FORGERY';
              break;
            }

            if (!this.whitelistedDomains.has(domain)) {
              details.badURL = true;
              riskLevel = 'SUSPICIOUS'; // More conservative for manual analysis
              break;
            }
          } catch (e) {
            details.badURL = true;
            riskLevel = 'SUSPICIOUS';
            break;
          }
        }
      }
      
      return { riskLevel, details };
    }

    // Original SMS-based verification logic for actual SMS messages
    const isTenDigitNumber = /^\d{10}$/.test(senderId);
    if (isTenDigitNumber) {
      details.isTenDigitNumber = true;
      riskLevel = 'SUSPICIOUS';
    } else if (!this.dltHeaders.has(senderId.toUpperCase())) {
      const isAlphanumeric = /^[A-Z0-9]{6}$/i.test(senderId);
      if (isAlphanumeric) {
        details.unlistedAlphanumeric = true;
        riskLevel = 'SUSPICIOUS';
      } else {
        // Only flag as HIGH_RISK_FORGERY if the sender format looks like SMS but isn't in DLT
        // Exclude obvious app/manual sources
        if (senderId.length <= 15 && !senderId.includes('_') && !senderId.includes(' ')) {
          details.missingHeader = true;
          riskLevel = 'HIGH_RISK_FORGERY';
        } else {
          // Probably an app or unusual source, mark as suspicious instead
          details.missingHeader = true;
          riskLevel = 'SUSPICIOUS';
        }
      }
    }

    // URL verification (same for both SMS and manual)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsInMessage = messageText.match(urlRegex);

    if (urlsInMessage) {
      for (const url of urlsInMessage) {
        try {
          const hostname = new URL(url).hostname;
          const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

          if (this.urlShorteners.has(domain)) {
            details.badURL = true;
            riskLevel = 'HIGH_RISK_FORGERY';
            break;
          }

          if (!this.whitelistedDomains.has(domain)) {
            details.badURL = true;
            if (riskLevel !== 'HIGH_RISK_FORGERY') {
                riskLevel = 'HIGH_RISK_FORGERY';
            }
            break;
          }
        } catch (e) {
          details.badURL = true;
          if (riskLevel !== 'HIGH_RISK_FORGERY') {
            riskLevel = 'SUSPICIOUS';
          }
          break;
        }
      }
    }

    return { riskLevel, details };
  }
}


