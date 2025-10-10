/**
 * Call Notification Service
 * Handles call notifications with report actions (like Truecaller)
 */

import { Alert, DeviceEventEmitter } from 'react-native';
import { notificationService } from './ExpoNotificationService';
import { QuickReportOptions, quickReportService } from './QuickReportService';

export interface CallNotificationData {
    type: 'call_notification';
    title: string;
    message: string;
    phoneNumber: string;
    maskedNumber: string;
    fraudType?: string;
    confidence: number;
    timestamp: number;
    action: 'block' | 'warn' | 'silence' | 'allow';
    showReportAction: boolean;
    callerName?: string;
    isVerifiedBusiness: boolean;
}

class CallNotificationService {
    private static instance: CallNotificationService;
    private isListening = false;

    static getInstance(): CallNotificationService {
        if (!CallNotificationService.instance) {
            CallNotificationService.instance = new CallNotificationService();
        }
        return CallNotificationService.instance;
    }

    /**
     * Initialize call notification listener
     */
    initialize(): void {
        if (this.isListening) return;

        try {
            // Listen for Android call notifications
            DeviceEventEmitter.addListener('com.shabari.CALL_NOTIFICATION', this.handleCallNotification.bind(this));
            DeviceEventEmitter.addListener('com.shabari.CALL_BLOCKED', this.handleCallBlocked.bind(this));
            DeviceEventEmitter.addListener('com.shabari.CALL_WARNING', this.handleCallWarning.bind(this));

            this.isListening = true;
            console.log('✅ CallNotificationService initialized');
        } catch (error) {
            console.error('❌ Failed to initialize CallNotificationService:', error);
        }
    }

    /**
     * Cleanup listeners
     */
    cleanup(): void {
        if (!this.isListening) return;

        try {
            DeviceEventEmitter.removeAllListeners('com.shabari.CALL_NOTIFICATION');
            DeviceEventEmitter.removeAllListeners('com.shabari.CALL_BLOCKED');
            DeviceEventEmitter.removeAllListeners('com.shabari.CALL_WARNING');

            this.isListening = false;
            console.log('✅ CallNotificationService cleaned up');
        } catch (error) {
            console.error('❌ Failed to cleanup CallNotificationService:', error);
        }
    }

    /**
     * Handle general call notifications
     */
    private async handleCallNotification(data: any): Promise<void> {
        try {
            console.log('📞 Call notification received:', data);

            const notificationData = this.parseNotificationData(data);
            if (!notificationData) return;

            await this.showCallNotification(notificationData);

        } catch (error) {
            console.error('Error handling call notification:', error);
        }
    }

    /**
     * Handle blocked call notifications
     */
    private async handleCallBlocked(data: any): Promise<void> {
        try {
            const { phone_number, fraud_type, confidence } = data;

            await notificationService.showNotification({
                title: '🚫 Fraud Call Blocked',
                message: `Blocked suspicious call from ${this.formatPhoneNumber(phone_number)}`,
                data: {
                    type: 'call_blocked',
                    phoneNumber: phone_number,
                    fraudType: fraud_type,
                    confidence: confidence,
                    showReportAction: false // Already blocked, no need to report
                }
            });

            console.log('🚫 Fraud call blocked notification shown');

        } catch (error) {
            console.error('Error handling blocked call:', error);
        }
    }

    /**
     * Handle warning call notifications
     */
    private async handleCallWarning(data: any): Promise<void> {
        try {
            const { phone_number, fraud_type, confidence } = data;

            await notificationService.showNotification({
                title: '⚠️ Suspicious Call',
                message: `Possible spam from ${this.formatPhoneNumber(phone_number)}`,
                data: {
                    type: 'call_warning',
                    phoneNumber: phone_number,
                    fraudType: fraud_type,
                    confidence: confidence,
                    showReportAction: true
                }
            });

            console.log('⚠️ Suspicious call warning shown');

        } catch (error) {
            console.error('Error handling warning call:', error);
        }
    }

    /**
     * Show call notification with report actions
     */
    private async showCallNotification(data: CallNotificationData): Promise<void> {
        try {
            const { title, message, phoneNumber, showReportAction, action, callerName, isVerifiedBusiness } = data;

            // Determine notification style based on action
            const notificationStyle = this.getNotificationStyle(action);

            // Create notification with actions if reporting is available
            const notificationData: any = {
                title: `${notificationStyle.icon} ${title}`,
                body: message,
                data: {
                    type: 'call_notification',
                    phoneNumber: phoneNumber,
                    callerName: callerName,
                    action: action,
                    showReportAction: showReportAction,
                    isVerifiedBusiness: isVerifiedBusiness
                }
            };

            // Add action buttons for allowed calls
            if (showReportAction && action === 'allow') {
                notificationData.categoryIdentifier = 'incoming_call';
                notificationData.actions = [
                    {
                        identifier: 'report_spam',
                        title: '🚫 Report Spam',
                        options: { destructive: true }
                    },
                    {
                        identifier: 'report_fraud',
                        title: '⚠️ Report Fraud',
                        options: { destructive: true }
                    },
                    {
                        identifier: 'mark_safe',
                        title: '✅ Mark Safe',
                        options: { destructive: false }
                    }
                ];
            }

            await notificationService.showNotification(notificationData);

            // For high-priority calls (fraud/spam), also show alert
            if (action === 'warn' || action === 'silence') {
                setTimeout(() => {
                    this.showCallAlert(data);
                }, 1000);
            }

        } catch (error) {
            console.error('Error showing call notification:', error);
        }
    }

    /**
     * Show alert dialog for important calls
     */
    private showCallAlert(data: CallNotificationData): void {
        const { phoneNumber, action, callerName, showReportAction } = data;
        const displayName = callerName || this.formatPhoneNumber(phoneNumber);

        if (action === 'warn') {
            Alert.alert(
                '⚠️ Suspicious Call Detected',
                `Possible spam/fraud call from ${displayName}`,
                [
                    { text: 'Dismiss', style: 'cancel' },
                    ...(showReportAction ? [
                        {
                            text: 'Report This Number',
                            onPress: () => this.handleReportFromAlert(phoneNumber, callerName)
                        }
                    ] : [])
                ]
            );
        }
    }

    /**
     * Handle report action from alert/notification
     */
    private async handleReportFromAlert(phoneNumber: string, callerName?: string): Promise<void> {
        const options: QuickReportOptions = {
            phoneNumber: phoneNumber,
            callerName: callerName,
            timestamp: Date.now(),
            context: 'incoming_call'
        };

        await quickReportService.showQuickReportDialog(options);
    }

    /**
     * Handle notification action responses
     */
    async handleNotificationAction(actionIdentifier: string, notification: any): Promise<void> {
        try {
            const { phoneNumber, callerName } = notification.request.content.data;

            const options: QuickReportOptions = {
                phoneNumber: phoneNumber,
                callerName: callerName,
                timestamp: Date.now(),
                context: 'notification'
            };

            switch (actionIdentifier) {
                case 'report_spam':
                    await quickReportService.quickReport({
                        ...options,
                        category: 'spam',
                        reason: 'Reported as spam from call notification'
                    });
                    break;

                case 'report_fraud':
                    await quickReportService.quickReport({
                        ...options,
                        category: 'fraud',
                        reason: 'Reported as fraud from call notification'
                    });
                    break;

                case 'mark_safe':
                    await quickReportService.reportAsLegitimate(options);
                    break;

                case 'not_spam':
                    await quickReportService.reportAsLegitimate(options);
                    break;

                default:
                    console.log('Unknown notification action:', actionIdentifier);
            }

        } catch (error) {
            console.error('Error handling notification action:', error);
        }
    }

    /**
     * Show post-call feedback for allowed calls
     */
    async showPostCallFeedback(phoneNumber: string, callDuration: number): Promise<void> {
        // Only show feedback for calls longer than 5 seconds (to avoid accidental pickups)
        if (callDuration < 5000) return;

        // Check if this number was recently reported
        const wasReported = await quickReportService.wasRecentlyReported(phoneNumber);
        if (wasReported) return;

        const options: QuickReportOptions = {
            phoneNumber: phoneNumber,
            callDuration: callDuration,
            timestamp: Date.now(),
            context: 'call_log'
        };

        // Show feedback dialog after a delay
        setTimeout(() => {
            quickReportService.showSpamFeedbackDialog(options);
        }, 2000);
    }

    /**
     * Parse notification data from Android
     */
    private parseNotificationData(data: any): CallNotificationData | null {
        try {
            if (data.notification_data) {
                return JSON.parse(data.notification_data);
            }
            return null;
        } catch (error) {
            console.error('Error parsing notification data:', error);
            return null;
        }
    }

    /**
     * Get notification style based on action
     */
    private getNotificationStyle(action: string): { icon: string; color: string } {
        switch (action) {
            case 'block':
                return { icon: '🚫', color: '#EF4444' };
            case 'warn':
                return { icon: '⚠️', color: '#F59E0B' };
            case 'silence':
                return { icon: '🔇', color: '#8B5CF6' };
            case 'allow':
            default:
                return { icon: '📞', color: '#3B82F6' };
        }
    }

    /**
     * Format phone number for display
     */
    private formatPhoneNumber(phoneNumber: string): string {
        if (!phoneNumber) return 'Unknown';
        
        // Remove non-digits except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return cleaned.substring(1).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.startsWith('+91') && cleaned.length === 13) {
            return cleaned.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2 $3');
        }
        
        return phoneNumber;
    }
}

export const callNotificationService = CallNotificationService.getInstance();
