/**
 * Call Log Screen
 * Shows recent calls with spam reporting options (like Truecaller)
 */

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// @ts-ignore - React Native component type issues with strict TypeScript
import CallLogService, { CallLogEntry } from '../services/CallLogService';
import { phoneReportingService } from '../services/PhoneReportingService';
import { QuickReportOptions, quickReportService } from '../services/QuickReportService';

// CallLogEntry interface is now imported from CallLogService

interface CallLogScreenProps {
    navigation: any;
}

export const CallLogScreen = ({ navigation }: CallLogScreenProps) => {
    const [callLog, setCallLog] = useState<CallLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportingNumber, setReportingNumber] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const callLogService = CallLogService.getInstance();

    useEffect(() => {
        loadCallLog();
    }, []);

    const loadCallLog = async () => {
        try {
            setLoading(true);
            setError(null);
            setPermissionDenied(false);
            
            console.log('📞 Loading real call log data...');
            
            // Get real call log data with spam detection
            const result = await callLogService.getCallLogWithSpamDetection(50);
            
            if (!result.success) {
                if (result.error?.includes('permission')) {
                    setPermissionDenied(true);
                    setError('Call log permission is required to view your call history. Please enable it in settings.');
                } else {
                    setError(result.error || 'Failed to load call log');
                }
                return;
            }

            if (!result.data || result.data.length === 0) {
                console.log('📞 No call log data found');
                setCallLog([]);
                return;
            }

            // Enhance with additional reputation data from phone reporting service
            const enhancedLog = await Promise.all(
                result.data.map(async (entry) => {
                    try {
                        const reputation = await phoneReportingService.getPhoneReputation(entry.phoneNumber);
                        return {
                            ...entry,
                            reputationScore: reputation?.reputation_score || entry.reputationScore,
                            isSpam: reputation ? reputation.reputation_score < 50 : entry.isSpam
                        };
                    } catch (error) {
                        console.warn('⚠️ Error getting reputation for', entry.phoneNumber, error);
                        return entry;
                    }
                })
            );

            setCallLog(enhancedLog);
            console.log(`✅ Loaded ${enhancedLog.length} call log entries`);

        } catch (error) {
            console.error('❌ Error loading call log:', error);
            setError('Failed to load call log. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadCallLog();
    };

    const handleReportSpam = async (entry: CallLogEntry) => {
        setReportingNumber(entry.phoneNumber);

        try {
            const options: QuickReportOptions = {
                phoneNumber: entry.phoneNumber,
                callerName: entry.callerName,
                callDuration: entry.duration,
                timestamp: entry.timestamp,
                context: 'call_log'
            };

            await quickReportService.showQuickReportDialog(options);
        } catch (error) {
            Alert.alert('Error', 'Failed to report number');
        } finally {
            setReportingNumber(null);
        }
    };

    const handleMarkSafe = async (entry: CallLogEntry) => {
        try {
            Alert.alert(
                'Mark as Safe',
                `Mark ${entry.callerName || formatPhoneNumber(entry.phoneNumber)} as safe/legitimate?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Mark Safe',
                        onPress: async () => {
                            // Implementation would mark number as legitimate
                            console.log('Marked as safe:', entry.phoneNumber);
                            Alert.alert('Success', 'Number marked as safe');
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to mark as safe');
        }
    };

    const formatPhoneNumber = (phoneNumber: string): string => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        return phoneNumber;
    };

    const formatDuration = (duration: number): string => {
        if (duration === 0) return 'Missed';
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays === 0) {
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return `${diffMinutes} min ago`;
            }
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getCallTypeIcon = (type: string): string => {
        switch (type) {
            case 'incoming':
                return 'call-received';
            case 'outgoing':
                return 'call-made';
            case 'missed':
                return 'call-missed';
            default:
                return 'call';
        }
    };

    const getReputationColor = (score?: number): string => {
        if (!score) return '#6B7280';
        if (score >= 70) return '#10B981'; // Green
        if (score >= 50) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    const renderCallEntry = ({ item }: { item: CallLogEntry }) => {
        const isReporting = reportingNumber === item.phoneNumber;

        return (
            <View style={[
                styles.callEntry,
                item.isSpam && styles.spamCallEntry
            ]}>
                <View style={styles.callInfo}>
                    <View style={styles.callHeader}>
                        <Ionicons
                            name={getCallTypeIcon(item.type) as any}
                            size={20}
                            color={item.isSpam ? '#EF4444' : '#6B7280'}
                        />
                        <View style={styles.callerInfo}>
                            <Text style={[
                                styles.callerName,
                                item.isSpam && styles.spamCallerName
                            ]}>
                                {item.callerName || formatPhoneNumber(item.phoneNumber)}
                            </Text>
                            {item.callerName && (
                                <Text style={styles.phoneNumber}>
                                    {formatPhoneNumber(item.phoneNumber)}
                                </Text>
                            )}
                        </View>
                        {item.reputationScore !== undefined && (
                            <View style={[
                                styles.reputationBadge,
                                { backgroundColor: getReputationColor(item.reputationScore) }
                            ]}>
                                <Text style={styles.reputationScore}>
                                    {item.reputationScore}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.callDetails}>
                        <Text style={styles.timestamp}>
                            {formatTimestamp(item.timestamp)}
                        </Text>
                        <Text style={styles.duration}>
                            {formatDuration(item.duration)}
                        </Text>
                        {item.isSpam && (
                            <View style={styles.spamBadge}>
                                <Text style={styles.spamText}>SPAM</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.callActions}>
                    {!item.isSpam && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.reportButton]}
                            onPress={() => handleReportSpam(item)}
                            disabled={isReporting}
                        >
                            {isReporting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Report</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {item.isSpam && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.safeButton]}
                            onPress={() => handleMarkSafe(item)}
                        >
                            <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Not Spam</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, styles.infoButton]}
                        onPress={() => {
                            Alert.alert(
                                'Call Details',
                                `Number: ${item.phoneNumber}\n` +
                                `Reputation: ${item.reputationScore || 'Unknown'}\n` +
                                `Type: ${item.type}\n` +
                                `Duration: ${formatDuration(item.duration)}\n` +
                                `Time: ${new Date(item.timestamp).toLocaleString()}`
                            );
                        }}
                    >
                        <Ionicons name="information-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="call" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Call History</Text>
            <Text style={styles.emptySubtitle}>
                Your recent calls will appear here with spam detection
            </Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.errorState}>
            <MaterialIcons name="error-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to Load Call History</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            {permissionDenied && (
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={async () => {
                        const granted = await callLogService.requestCallLogPermissions();
                        if (granted) {
                            loadCallLog();
                        }
                    }}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={styles.retryButton}
                onPress={loadCallLog}
            >
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading call history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Call History</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {error ? (
                renderErrorState()
            ) : (
                <FlatList
                    data={callLog}
                    renderItem={renderCallEntry}
                    keyExtractor={(item: CallLogEntry) => item.id}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    contentContainerStyle={callLog.length === 0 ? styles.emptyContainer : undefined}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    refreshButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    callEntry: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    spamCallEntry: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    callInfo: {
        flex: 1,
    },
    callHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    callerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    callerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    spamCallerName: {
        color: '#DC2626',
    },
    phoneNumber: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    reputationBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 32,
        alignItems: 'center',
    },
    reputationScore: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    callDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 16,
    },
    duration: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
    },
    spamBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    spamText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    callActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    },
    reportButton: {
        backgroundColor: '#EF4444',
    },
    safeButton: {
        backgroundColor: '#10B981',
    },
    infoButton: {
        backgroundColor: '#6B7280',
        paddingHorizontal: 8,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#6B7280',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
