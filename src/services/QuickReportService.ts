/**
 * Quick Report Service
 * Handles instant phone number reporting from call notifications and call log
 */

import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from './ExpoNotificationService';
import { PhoneReport, phoneReportingService } from './PhoneReportingService';

export interface QuickReportOptions {
    phoneNumber: string;
    callerName?: string;
    callDuration?: number;
    timestamp?: number;
    context: 'incoming_call' | 'call_log' | 'notification';
}

export interface QuickReportResult {
    success: boolean;
    message: string;
    needsManualInput?: boolean;
}

class QuickReportService {
    private static instance: QuickReportService;

    static getInstance(): QuickReportService {
        if (!QuickReportService.instance) {
            QuickReportService.instance = new QuickReportService();
        }
        return QuickReportService.instance;
    }

    /**
     * Show quick report dialog for a phone number
     */
    async showQuickReportDialog(options: QuickReportOptions): Promise<void> {
        const { phoneNumber, callerName, context } = options;
        const displayName = callerName || this.formatPhoneNumber(phoneNumber);

        Alert.alert(
            '📞 Report This Number?',
            `Report ${displayName} as spam or fraud?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '🚫 Spam',
                    onPress: () => this.quickReport({
                        ...options,
                        category: 'spam',
                        reason: 'Quick report: Unwanted/spam call'
                    })
                },
                {
                    text: '⚠️ Fraud',
                    style: 'destructive',
                    onPress: () => this.quickReport({
                        ...options,
                        category: 'fraud',
                        reason: 'Quick report: Suspicious/fraudulent call'
                    })
                },
                {
                    text: '📝 Detailed Report',
                    onPress: () => this.openDetailedReport(options)
                }
            ]
        );
    }

    /**
     * Quick report with predefined categories
     */
    async quickReport(options: QuickReportOptions & {
        category: 'spam' | 'fraud' | 'telemarketer';
        reason: string;
    }): Promise<QuickReportResult> {
        try {
            const { user } = useAuthStore.getState();
            
            if (!user) {
                Alert.alert(
                    'Authentication Required',
                    'Please log in to report numbers',
                    [{ text: 'OK' }]
                );
                return { success: false, message: 'User not authenticated' };
            }

            // Show loading notification
            await notificationService.showNotification({
                title: 'Reporting Number...',
                message: `Submitting report for ${this.formatPhoneNumber(options.phoneNumber)}`,
                data: { type: 'report_progress' }
            });

            const report: PhoneReport = {
                phoneNumber: options.phoneNumber,
                category: options.category,
                description: this.generateDescription(options),
                reportedBy: user.id
            };

            const result = await phoneReportingService.reportPhoneNumber(report);

            if (result.success) {
                // Show success notification
                await notificationService.showNotification({
                    title: '✅ Number Reported',
                    message: `Successfully reported ${this.formatPhoneNumber(options.phoneNumber)} as ${options.category}`,
                    data: { type: 'report_success', phoneNumber: options.phoneNumber }
                });

                return { success: true, message: 'Report submitted successfully' };
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Quick report failed:', error);
            
            Alert.alert(
                'Report Failed',
                'Unable to submit report. Please try the detailed report form.',
                [
                    { text: 'Cancel' },
                    { 
                        text: 'Try Detailed Report',
                        onPress: () => this.openDetailedReport(options)
                    }
                ]
            );

            return { 
                success: false, 
                message: 'Report submission failed',
                needsManualInput: true
            };
        }
    }

    /**
     * Show spam/not spam options for quick feedback
     */
    async showSpamFeedbackDialog(options: QuickReportOptions): Promise<void> {
        const { phoneNumber, callerName } = options;
        const displayName = callerName || this.formatPhoneNumber(phoneNumber);

        Alert.alert(
            '🤔 Was this call spam?',
            `Help improve our spam detection for ${displayName}`,
            [
                { text: 'Not Spam', onPress: () => this.reportAsLegitimate(options) },
                { text: 'Skip', style: 'cancel' },
                { 
                    text: 'Yes, Spam', 
                    style: 'destructive',
                    onPress: () => this.showQuickReportDialog(options)
                }
            ]
        );
    }

    /**
     * Report number as legitimate (not spam)
     */
    async reportAsLegitimate(options: QuickReportOptions): Promise<void> {
        try {
            const { user } = useAuthStore.getState();
            
            if (!user) return;

            // This would ideally go to a separate "legitimate_reports" table
            // For now, we'll just log it and potentially add to reputation system
            console.log('Number reported as legitimate:', options.phoneNumber);
            
            await notificationService.showNotification({
                title: '👍 Feedback Received',
                message: 'Thank you for helping improve our spam detection',
                data: { type: 'feedback_success' }
            });

        } catch (error) {
            console.error('Failed to report as legitimate:', error);
        }
    }

    /**
     * Open detailed report form (navigate to ReportNumberScreen)
     */
    private openDetailedReport(options: QuickReportOptions): void {
        // This would require navigation context
        // For now, show instruction to user
        Alert.alert(
            'Detailed Report',
            'Go to Settings > Support > Report Spam Number for a detailed report form.',
            [{ text: 'OK' }]
        );
    }

    /**
     * Generate automatic description based on context
     */
    private generateDescription(options: QuickReportOptions & { category: string; reason: string }): string {
        const { phoneNumber, callerName, callDuration, timestamp, context, category, reason } = options;
        
        let description = reason;
        
        // Add context information
        if (context === 'incoming_call') {
            description += '. Reported immediately after receiving call.';
        } else if (context === 'call_log') {
            description += '. Reported from call history.';
        }

        // Add call details if available
        if (callDuration !== undefined) {
            if (callDuration === 0) {
                description += ' Call was not answered.';
            } else {
                description += ` Call duration: ${Math.round(callDuration / 1000)} seconds.`;
            }
        }

        // Add caller name if available
        if (callerName && callerName !== phoneNumber) {
            description += ` Caller ID showed: "${callerName}".`;
        }

        // Add timestamp
        if (timestamp) {
            const date = new Date(timestamp);
            description += ` Call received on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}.`;
        }

        return description;
    }

    /**
     * Format phone number for display
     */
    private formatPhoneNumber(phoneNumber: string): string {
        // Remove country code for display if it's a long number
        if (phoneNumber.length > 10) {
            const cleaned = phoneNumber.replace(/\D/g, '');
            if (cleaned.length === 11 && cleaned.startsWith('1')) {
                // US number with country code
                return cleaned.substring(1).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
                // Indian number with country code
                return '+91 ' + cleaned.substring(2).replace(/(\d{5})(\d{5})/, '$1 $2');
            }
        }
        
        // Default formatting
        return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    /**
     * Check if number was recently reported by user (to avoid duplicate reports)
     */
    async wasRecentlyReported(phoneNumber: string): Promise<boolean> {
        try {
            const { user } = useAuthStore.getState();
            if (!user) return false;

            const userReports = await phoneReportingService.getUserReports(user.id, 10);
            const recentReports = userReports.filter(report => 
                report.phone_number === phoneNumber &&
                Date.now() - new Date(report.created_at).getTime() < 24 * 60 * 60 * 1000 // 24 hours
            );

            return recentReports.length > 0;
        } catch (error) {
            console.error('Error checking recent reports:', error);
            return false;
        }
    }

    /**
     * Get quick report statistics for user
     */
    async getQuickReportStats(): Promise<{
        totalReports: number;
        spamReports: number;
        fraudReports: number;
        recentActivity: number;
    }> {
        try {
            const { user } = useAuthStore.getState();
            if (!user) {
                return { totalReports: 0, spamReports: 0, fraudReports: 0, recentActivity: 0 };
            }

            const userReports = await phoneReportingService.getUserReports(user.id, 100);
            const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

            return {
                totalReports: userReports.length,
                spamReports: userReports.filter(r => r.category === 'spam').length,
                fraudReports: userReports.filter(r => r.category === 'fraud').length,
                recentActivity: userReports.filter(r => 
                    new Date(r.created_at).getTime() > recentThreshold
                ).length
            };
        } catch (error) {
            console.error('Error getting report stats:', error);
            return { totalReports: 0, spamReports: 0, fraudReports: 0, recentActivity: 0 };
        }
    }
}

export const quickReportService = QuickReportService.getInstance();
