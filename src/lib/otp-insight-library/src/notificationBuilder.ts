// Import expo-notifications for real notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.log('[NotificationBuilder] expo-notifications not available:', error);
}

export interface NotificationOptions {
  title: string;
  body: string;
  data?: { [key: string]: any };
  priority?: 'default' | 'high' | 'low' | 'max' | 'min';
  sound?: boolean;
  // Add other expo-notifications options as needed
}

export class NotificationBuilder {
  private isExpoNotificationsAvailable: boolean = false;

  constructor() {
    this.isExpoNotificationsAvailable = !!Notifications;
    
    if (this.isExpoNotificationsAvailable) {
      this.setupNotifications();
    } else {
      console.log('[NotificationBuilder] Running in mock mode - notifications will be logged to console');
    }
  }

  /**
   * Setup expo-notifications configuration
   */
  private async setupNotifications(): Promise<void> {
    if (!this.isExpoNotificationsAvailable) return;

    try {
      // Configure notifications to show alerts
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      console.log('[NotificationBuilder] Expo notifications configured successfully');
    } catch (error) {
      console.error('[NotificationBuilder] Failed to setup notifications:', error);
    }
  }

  /**
   * Send a notification using expo-notifications or fallback to console
   */
  private async sendNotification(options: NotificationOptions): Promise<void> {
    if (this.isExpoNotificationsAvailable) {
      try {
        const notificationContent = {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: options.sound !== false,
          priority: this.mapPriorityToExpo(options.priority || 'default'),
        };

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null, // Show immediately
        });

        console.log('[NotificationBuilder] Notification sent:', options.title);
      } catch (error) {
        console.error('[NotificationBuilder] Failed to send notification:', error);
        // Fallback to console logging
        this.logNotification(options);
      }
    } else {
      // Fallback to console logging
      this.logNotification(options);
    }
  }

  /**
   * Map priority to expo-notifications format
   */
  private mapPriorityToExpo(priority: string): string {
    switch (priority) {
      case 'high':
      case 'max':
        return 'high';
      case 'low':
      case 'min':
        return 'low';
      default:
        return 'default';
    }
  }

  /**
   * Fallback console logging for notifications
   */
  private logNotification(options: NotificationOptions): void {
    console.log('📱 NOTIFICATION:', {
      title: options.title,
      body: options.body,
      priority: options.priority,
      data: options.data,
    });
  }

  /**
   * Sends a high-priority warning notification for a forged sender.
   *
   * @param messageText The original message text.
   */
  public async sendWarningNotification(messageText: string): Promise<void> {
    const options: NotificationOptions = {
      title: '⚠️ SENDER WARNING!',
      body: 'This message appears to be a forgery. Do NOT trust this OTP.',
      priority: 'high',
      sound: true,
      data: { type: 'sender_forgery', originalMessage: messageText },
    };
    
    await this.sendNotification(options);
  }

  /**
   * Sends a payment alert notification.
   *
   * @param amount The amount involved in the payment.
   * @param messageText The original message text.
   */
  public async sendPaymentAlert(amount: string, messageText: string): Promise<void> {
    const options: NotificationOptions = {
      title: '🚨 PAYMENT ALERT!',
      body: `This OTP will authorize a PAYMENT of ₹${amount}.`,
      priority: 'high',
      sound: true,
      data: { type: 'payment_alert', amount: amount, originalMessage: messageText },
    };
    
    await this.sendNotification(options);
  }

  /**
   * Sends a suspicious OTP notification.
   *
   * @param messageText The original message text.
   * @param reason A brief reason for the suspicion.
   */
  public async sendSuspiciousNotification(messageText: string, reason: string): Promise<void> {
    const options: NotificationOptions = {
      title: '⚠️ Suspicious OTP detected.',
      body: `Reason: ${reason}.`,
      priority: 'high',
      sound: true,
      data: { type: 'suspicious_otp', reason: reason, originalMessage: messageText },
    };
    
    await this.sendNotification(options);
  }

  /**
   * Sends a standard OTP insight notification.
   *
   * @param messageText The original message text.
   */
  public async sendStandardNotification(messageText: string): Promise<void> {
    const options: NotificationOptions = {
      title: '🔒 OTP Insight: Standard Code',
      body: 'This appears to be a standard login/verification code.',
      priority: 'default',
      sound: false,
      data: { type: 'standard_otp', originalMessage: messageText },
    };
    
    await this.sendNotification(options);
  }

  /**
   * Conceptual method to mark a notification as safe (updates local state only).
   * In a real app, this would interact with local storage.
   *
   * @param notificationId The ID of the notification to mark safe.
   */
  public markNotificationSafe(notificationId: string): void {
    console.log(`[NotificationBuilder] Notification ${notificationId} marked as safe`);
    // Conceptual: Update local storage to reflect user action
  }

  /**
   * Get notification service status
   */
  public getStatus(): {
    isAvailable: boolean;
    mode: 'expo' | 'mock';
  } {
    return {
      isAvailable: this.isExpoNotificationsAvailable,
      mode: this.isExpoNotificationsAvailable ? 'expo' : 'mock',
    };
  }
}


