export interface UserContext {
  lastInteractionTimestamp: number | null;
}

export interface OtpEvent {
  timestamp: number;
}

// In-memory storage for demonstration. In a real app, this would use AsyncStorage or SQLite.
let userContext: UserContext = {
  lastInteractionTimestamp: null,
};

let otpEvents: OtpEvent[] = [];

export class UserContextTracker {
  /**
   * Updates the last user interaction timestamp.
   * This should be called whenever there's a significant user interaction (e.g., app foreground, user input).
   */
  public updateLastInteraction(): void {
    userContext.lastInteractionTimestamp = Date.now();
    console.log(`Last interaction updated: ${userContext.lastInteractionTimestamp}`);
  }

  /**
   * Checks if the current OTP arrival is suspicious based on the last user interaction.
   * @param otpArrivalTimestamp The timestamp when the OTP message was received.
   * @param thresholdMinutes The time threshold in minutes (e.g., 2 minutes).
   * @returns True if suspicious, false otherwise.
   */
  public isContextSuspicious(otpArrivalTimestamp: number, thresholdMinutes: number = 2): boolean {
    if (userContext.lastInteractionTimestamp === null) {
      // If no prior interaction, it's not suspicious by this rule (could be first use)
      return false;
    }
    const timeElapsed = (otpArrivalTimestamp - userContext.lastInteractionTimestamp) / (1000 * 60);
    const suspicious = timeElapsed > thresholdMinutes;
    if (suspicious) {
      console.log(`Context suspicious: Time elapsed since last interaction (${timeElapsed.toFixed(2)} min) > ${thresholdMinutes} min.`);
    }
    return suspicious;
  }
}

export class OtpFrequencyTracker {
  /**
   * Records an OTP event with the current timestamp.
   */
  public recordOtpEvent(): void {
    const now = Date.now();
    otpEvents.push({ timestamp: now });
    // Clean up old events to prevent memory leak
    this.cleanupOldEvents();
    console.log(`OTP event recorded at: ${now}. Total events: ${otpEvents.length}`);
  }

  /**
   * Checks if there's a possible attack based on OTP frequency within a sliding window.
   * @param windowMinutes The sliding window duration in minutes (e.g., 5 minutes).
   * @param maxOtpsInWindow The maximum number of OTPs allowed within the window without user action.
   * @returns True if a possible attack is detected, false otherwise.
   */
  public isPossibleAttack(windowMinutes: number = 5, maxOtpsInWindow: number = 3): boolean {
    const now = Date.now();
    const windowStart = now - (windowMinutes * 1000 * 60);

    // Filter events within the sliding window
    const recentOtps = otpEvents.filter(event => event.timestamp >= windowStart);

    const possibleAttack = recentOtps.length > maxOtpsInWindow;
    if (possibleAttack) {
      console.log(`Possible attack detected: ${recentOtps.length} OTPs in last ${windowMinutes} min (max allowed: ${maxOtpsInWindow}).`);
    }
    return possibleAttack;
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    // Keep events from the last 10 minutes (arbitrary, can be adjusted)
    const cutoff = now - (10 * 1000 * 60);
    otpEvents = otpEvents.filter(event => event.timestamp >= cutoff);
  }
}


