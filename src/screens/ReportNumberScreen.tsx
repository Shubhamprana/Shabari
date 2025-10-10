/**
 * Report Number Screen
 * Allows users to manually report suspicious/spam phone numbers
 */

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { phoneReportingService } from '../services/PhoneReportingService';
import { useAuthStore } from '../stores/authStore';

interface ReportNumberScreenProps {
    navigation: any;
}

export const ReportNumberScreen: React.FC<ReportNumberScreenProps> = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [category, setCategory] = useState<'spam' | 'fraud' | 'telemarketer' | 'other'>('spam');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuthStore();

    const categories = [
        { id: 'spam', label: 'Spam/Unwanted', icon: 'call-outline', color: '#F59E0B' },
        { id: 'fraud', label: 'Fraud/Scam', icon: 'warning-outline', color: '#EF4444' },
        { id: 'telemarketer', label: 'Telemarketer', icon: 'business-outline', color: '#8B5CF6' },
        { id: 'other', label: 'Other', icon: 'help-circle-outline', color: '#6B7280' }
    ];

    const validatePhoneNumber = (number: string): boolean => {
        // Remove all non-digit characters
        const cleaned = number.replace(/\D/g, '');
        
        // Check if it's a valid phone number (10-15 digits)
        if (cleaned.length < 10 || cleaned.length > 15) {
            return false;
        }
        
        // Additional validation for common patterns
        const validPatterns = [
            /^\+?[1-9]\d{9,14}$/, // International format
            /^[1-9]\d{9}$/, // 10-digit US format
            /^\+91[6-9]\d{9}$/, // Indian format
        ];
        
        return validPatterns.some(pattern => pattern.test(number));
    };

    const formatPhoneNumber = (number: string): string => {
        // Remove all non-digit characters except +
        const cleaned = number.replace(/[^\d+]/g, '');
        
        // Add + if not present and number doesn't start with it
        if (!cleaned.startsWith('+') && cleaned.length > 10) {
            return '+' + cleaned;
        }
        
        return cleaned;
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please log in to report numbers');
            return;
        }

        if (!phoneNumber.trim()) {
            Alert.alert('Missing Information', 'Please enter a phone number');
            return;
        }

        const formattedNumber = formatPhoneNumber(phoneNumber);
        
        if (!validatePhoneNumber(formattedNumber)) {
            Alert.alert(
                'Invalid Phone Number', 
                'Please enter a valid phone number (10-15 digits)'
            );
            return;
        }

        if (!description.trim()) {
            Alert.alert('Missing Information', 'Please provide a description of why you\'re reporting this number');
            return;
        }

        try {
            setIsSubmitting(true);

            await phoneReportingService.reportPhoneNumber({
                phoneNumber: formattedNumber,
                category,
                description: description.trim(),
                reportedBy: user.id
            });

            Alert.alert(
                'Report Submitted',
                'Thank you for reporting this number. Our team will review it and take appropriate action.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Clear form
                            setPhoneNumber('');
                            setDescription('');
                            setCategory('spam');
                            navigation.goBack();
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert(
                'Submission Failed',
                'Failed to submit your report. Please try again later.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        if (phoneNumber || description) {
            Alert.alert(
                'Discard Report?',
                'You have unsaved changes. Are you sure you want to go back?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Report Number</Text>
                            <View style={styles.headerSpacer} />
                        </View>

                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {/* Info Banner */}
                            <View style={styles.infoBanner}>
                                <MaterialIcons name="info" size={20} color="#3B82F6" />
                                <Text style={styles.infoText}>
                                    Help protect the community by reporting suspicious numbers
                                </Text>
                            </View>

                            {/* Phone Number Input */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Phone Number</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="Enter phone number (e.g., +1234567890)"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Category Selection */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Category</Text>
                                <View style={styles.categoryGrid}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryCard,
                                                category === cat.id && styles.categoryCardSelected
                                            ]}
                                            onPress={() => setCategory(cat.id as any)}
                                        >
                                            <Ionicons 
                                                name={cat.icon as any} 
                                                size={24} 
                                                color={category === cat.id ? '#FFFFFF' : cat.color} 
                                            />
                                            <Text style={[
                                                styles.categoryLabel,
                                                category === cat.id && styles.categoryLabelSelected
                                            ]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Description Input */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Description</Text>
                                <Text style={styles.sectionSubtitle}>
                                    Describe why you're reporting this number (required)
                                </Text>
                                <TextInput
                                    style={styles.descriptionInput}
                                    placeholder="E.g., Received suspicious calls claiming to be from bank, asked for personal information..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Guidelines */}
                            <View style={styles.guidelines}>
                                <Text style={styles.guidelinesTitle}>Reporting Guidelines</Text>
                                <View style={styles.guidelineItem}>
                                    <Text style={styles.guidelineBullet}>•</Text>
                                    <Text style={styles.guidelineText}>Only report numbers that are genuinely suspicious or unwanted</Text>
                                </View>
                                <View style={styles.guidelineItem}>
                                    <Text style={styles.guidelineBullet}>•</Text>
                                    <Text style={styles.guidelineText}>Provide accurate information to help our review process</Text>
                                </View>
                                <View style={styles.guidelineItem}>
                                    <Text style={styles.guidelineBullet}>•</Text>
                                    <Text style={styles.guidelineText}>False reports may result in account restrictions</Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Submit Button */}
                        <View style={styles.submitContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!phoneNumber || !description || isSubmitting) && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!phoneNumber || !description || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Report</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    keyboardContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 24,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#1E40AF',
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    phoneInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryCardSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    categoryLabel: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
    categoryLabelSelected: {
        color: '#FFFFFF',
    },
    descriptionInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 100,
    },
    guidelines: {
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    guidelinesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 12,
    },
    guidelineItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    guidelineBullet: {
        fontSize: 16,
        color: '#92400E',
        marginRight: 8,
        fontWeight: 'bold',
    },
    guidelineText: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    submitContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
