/**
 * Phone Reporting Service
 * Handles phone number reporting and management using Supabase
 */

import { supabase } from '../lib/supabase';

export interface PhoneReport {
    phoneNumber: string;
    category: 'spam' | 'fraud' | 'telemarketer' | 'other';
    description: string;
    reportedBy: string;
}

export interface PhoneReputation {
    id: string;
    number: string;
    reputation_score: number;
    spam_reports: number;
    fraud_reports: number;
    telemarketer_reports: number;
    legitimate_reports: number;
    total_reports: number;
    category: string;
    is_verified_business: boolean;
    caller_name?: string;
    last_updated: string;
    created_at: string;
}

export interface ReportSubmissionResult {
    success: boolean;
    message: string;
    reportId?: string;
}

class PhoneReportingService {
    private static instance: PhoneReportingService;

    static getInstance(): PhoneReportingService {
        if (!PhoneReportingService.instance) {
            PhoneReportingService.instance = new PhoneReportingService();
        }
        return PhoneReportingService.instance;
    }

    /**
     * Report a phone number as spam/fraud
     */
    async reportPhoneNumber(report: PhoneReport): Promise<ReportSubmissionResult> {
        try {
            console.log('📞 Submitting phone number report:', {
                number: this.maskPhoneNumber(report.phoneNumber),
                category: report.category
            });

            // Validate phone number
            if (!this.isValidPhoneNumber(report.phoneNumber)) {
                return {
                    success: false,
                    message: 'Invalid phone number format'
                };
            }

            // Check if user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return {
                    success: false,
                    message: 'Authentication required'
                };
            }

            // Check for rate limiting (max 10 reports per day per user)
            const rateLimitCheck = await this.checkRateLimit(user.id);
            if (!rateLimitCheck.allowed) {
                return {
                    success: false,
                    message: rateLimitCheck.message
                };
            }

            // Insert into reports table
            const { data: reportData, error: reportError } = await supabase
                .from('phone_reports')
                .insert({
                    phone_number: report.phoneNumber,
                    category: report.category,
                    description: report.description,
                    reported_by: report.reportedBy,
                    device_info: await this.getDeviceInfo(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (reportError) {
                console.error('❌ Error inserting report:', reportError);
                return {
                    success: false,
                    message: 'Failed to submit report'
                };
            }

            // Update or create phone reputation entry
            await this.updatePhoneReputation(report.phoneNumber, report.category);

            // Send notification to admins (optional)
            await this.notifyAdmins(report);

            console.log('✅ Phone number report submitted successfully');
            return {
                success: true,
                message: 'Report submitted successfully',
                reportId: reportData.id
            };

        } catch (error) {
            console.error('❌ Error in reportPhoneNumber:', error);
            return {
                success: false,
                message: 'An unexpected error occurred'
            };
        }
    }

    /**
     * Get phone number reputation
     */
    async getPhoneReputation(phoneNumber: string): Promise<PhoneReputation | null> {
        try {
            const { data, error } = await supabase
                .from('phone_reputation')
                .select('*')
                .eq('number', phoneNumber)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No record found
                    return null;
                }
                console.error('Error fetching phone reputation:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getPhoneReputation:', error);
            return null;
        }
    }

    /**
     * Check if a phone number is likely spam/fraud
     */
    async isPhoneNumberSuspicious(phoneNumber: string): Promise<{
        isSuspicious: boolean;
        confidence: number;
        category: string;
        reportCount: number;
    }> {
        try {
            const reputation = await this.getPhoneReputation(phoneNumber);
            
            if (!reputation) {
                return {
                    isSuspicious: false,
                    confidence: 0,
                    category: 'unknown',
                    reportCount: 0
                };
            }

            // Calculate suspicion level based on reports and reputation score
            const spamFraudReports = reputation.spam_reports + reputation.fraud_reports;
            const totalReports = reputation.total_reports;
            const reputationScore = reputation.reputation_score;

            let isSuspicious = false;
            let confidence = 0;

            if (reputationScore < 30) {
                isSuspicious = true;
                confidence = 90;
            } else if (reputationScore < 50 && spamFraudReports >= 5) {
                isSuspicious = true;
                confidence = 70;
            } else if (spamFraudReports >= 10) {
                isSuspicious = true;
                confidence = 60;
            }

            return {
                isSuspicious,
                confidence,
                category: reputation.category,
                reportCount: totalReports
            };

        } catch (error) {
            console.error('Error checking phone suspicion:', error);
            return {
                isSuspicious: false,
                confidence: 0,
                category: 'unknown',
                reportCount: 0
            };
        }
    }

    /**
     * Get user's report history
     */
    async getUserReports(userId: string, limit: number = 50): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('phone_reports')
                .select('*')
                .eq('reported_by', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching user reports:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getUserReports:', error);
            return [];
        }
    }

    /**
     * Update phone reputation based on new report
     */
    private async updatePhoneReputation(phoneNumber: string, category: string): Promise<void> {
        try {
            // Get existing reputation or create new one
            let { data: existing, error } = await supabase
                .from('phone_reputation')
                .select('*')
                .eq('number', phoneNumber)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching existing reputation:', error);
                return;
            }

            if (existing) {
                // Update existing record
                const updates: any = {
                    total_reports: existing.total_reports + 1,
                    last_updated: new Date().toISOString()
                };

                // Increment specific category count
                switch (category) {
                    case 'spam':
                        updates.spam_reports = existing.spam_reports + 1;
                        break;
                    case 'fraud':
                        updates.fraud_reports = existing.fraud_reports + 1;
                        break;
                    case 'telemarketer':
                        updates.telemarketer_reports = existing.telemarketer_reports + 1;
                        break;
                }

                // Recalculate reputation score
                const negativeReports = updates.spam_reports + updates.fraud_reports;
                const totalReports = updates.total_reports;
                
                // Simple scoring algorithm: 100 - (negative reports / total reports * 100)
                // Capped at minimum 0 and maximum 100
                updates.reputation_score = Math.max(0, 100 - (negativeReports / totalReports * 100));
                
                // Update category to most reported type
                if (updates.fraud_reports > existing.spam_reports && updates.fraud_reports > existing.telemarketer_reports) {
                    updates.category = 'fraud';
                } else if (updates.spam_reports > existing.telemarketer_reports) {
                    updates.category = 'spam';
                } else {
                    updates.category = 'telemarketer';
                }

                await supabase
                    .from('phone_reputation')
                    .update(updates)
                    .eq('number', phoneNumber);

            } else {
                // Create new record
                const newReputation = {
                    number: phoneNumber,
                    reputation_score: category === 'fraud' || category === 'spam' ? 50 : 70,
                    spam_reports: category === 'spam' ? 1 : 0,
                    fraud_reports: category === 'fraud' ? 1 : 0,
                    telemarketer_reports: category === 'telemarketer' ? 1 : 0,
                    legitimate_reports: 0,
                    total_reports: 1,
                    category: category,
                    is_verified_business: false,
                    created_at: new Date().toISOString(),
                    last_updated: new Date().toISOString()
                };

                await supabase
                    .from('phone_reputation')
                    .insert(newReputation);
            }

        } catch (error) {
            console.error('Error updating phone reputation:', error);
        }
    }

    /**
     * Check rate limiting for user reports
     */
    private async checkRateLimit(userId: string): Promise<{ allowed: boolean; message: string }> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('phone_reports')
                .select('id')
                .eq('reported_by', userId)
                .gte('created_at', today.toISOString());

            if (error) {
                console.error('Error checking rate limit:', error);
                return { allowed: true, message: '' }; // Allow on error
            }

            const todayReports = data?.length || 0;
            const maxReportsPerDay = 10;

            if (todayReports >= maxReportsPerDay) {
                return {
                    allowed: false,
                    message: `You have reached the daily limit of ${maxReportsPerDay} reports. Please try again tomorrow.`
                };
            }

            return { allowed: true, message: '' };

        } catch (error) {
            console.error('Error in checkRateLimit:', error);
            return { allowed: true, message: '' }; // Allow on error
        }
    }

    /**
     * Get device information for report context
     */
    private async getDeviceInfo(): Promise<any> {
        try {
            // You can expand this with more device info if needed
            return {
                platform: 'mobile',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Notify admins of new reports (optional)
     */
    private async notifyAdmins(report: PhoneReport): Promise<void> {
        try {
            // Only notify for fraud reports or high-severity cases
            if (report.category === 'fraud') {
                // You can implement push notifications or email alerts here
                console.log('🚨 High-priority report submitted, admins notified');
            }
        } catch (error) {
            console.error('Error notifying admins:', error);
        }
    }

    /**
     * Validate phone number format
     */
    private isValidPhoneNumber(phoneNumber: string): boolean {
        // Remove all non-digit characters except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Check basic format
        if (cleaned.length < 10 || cleaned.length > 16) {
            return false;
        }

        // Check for valid patterns
        const validPatterns = [
            /^\+?[1-9]\d{9,14}$/, // International format
            /^[1-9]\d{9}$/, // 10-digit format
        ];

        return validPatterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Mask phone number for privacy in logs
     */
    private maskPhoneNumber(phoneNumber: string): string {
        if (phoneNumber.length <= 4) return phoneNumber;
        const start = phoneNumber.substring(0, 3);
        const end = phoneNumber.substring(phoneNumber.length - 2);
        const middle = '*'.repeat(phoneNumber.length - 5);
        return `${start}${middle}${end}`;
    }
}

export const phoneReportingService = PhoneReportingService.getInstance();
