export interface OTPAnalysis {
  otpCode: string | null;
  transactionType: 'PAYMENT_OUT' | 'PAYMENT_IN' | 'LOGIN' | null;
  amount?: string; // e.g., '20000'
  merchant?: string; // e.g., 'MerchantXYZ'
}

export class OTPInsightService {
  /**
   * Analyzes a message text to extract OTP, transaction type, amount, and merchant.
   *
   * @param messageText The text content of the message to analyze.
   * @returns An OTPAnalysis object containing the extracted information.
   */
  public analyzeOTP(messageText: string): OTPAnalysis {
    const analysis: OTPAnalysis = {
      otpCode: null,
      transactionType: null,
    };

    // 1. Extract a 6-digit OTP
    const otpRegex = /(\b\d{6}\b)/; // Matches a 6-digit number as a whole word
    const otpMatch = messageText.match(otpRegex);
    if (otpMatch && otpMatch[1]) {
      analysis.otpCode = otpMatch[1];
    }

    // 2. Extract monetary patterns (Rs. ?[d,]+, INR ?[d,]+)
    const amountRegex = /(?:Rs\.?\s?|INR\s?)([\d,]+(?:\.\d{1,2})?)/i; // Matches 

    const amountMatch = messageText.match(amountRegex);
    if (amountMatch && amountMatch[1]) {
      analysis.amount = amountMatch[1].replace(/,/g, ""); // Remove commas for consistency
    }

    // 3. Detect transaction type
    const lowerCaseMessage = messageText.toLowerCase();
    if (lowerCaseMessage.includes("debit") || lowerCaseMessage.includes("purchase") || lowerCaseMessage.includes("payment")) {
      analysis.transactionType = "PAYMENT_OUT";
    } else if (lowerCaseMessage.includes("credit") || lowerCaseMessage.includes("refund") || lowerCaseMessage.includes("received")) {
      analysis.transactionType = "PAYMENT_IN";
    } else if (lowerCaseMessage.includes("login") || lowerCaseMessage.includes("verify") || lowerCaseMessage.includes("otp")) {
      analysis.transactionType = "LOGIN";
    }

    // 4. Extract merchant (simple example, can be enhanced with a list of known merchants)
    // This is a very basic example and would need a more robust implementation
    // for production, possibly involving a list of known merchant names.
    const merchantKeywords = ["amazon", "flipkart", "swiggy", "zomato", "paytm", "google pay", "phonepe"];
    for (const keyword of merchantKeywords) {
      if (lowerCaseMessage.includes(keyword)) {
        analysis.merchant = keyword;
        break;
      }
    }

    return analysis;
  }
}


