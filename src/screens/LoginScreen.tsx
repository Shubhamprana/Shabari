import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  
  const { signIn, signUp, resetPassword, isLoading, error } = useAuthStore();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation for sign up
    if (isSignUp && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert(
          'Account Created! 🎉', 
          `A verification email has been sent to ${email}.\n\nPlease check your email and click the verification link to activate your account. The link will open directly in the Shabari app.`,
          [{ text: 'OK' }]
        );
        // Switch back to sign in mode
        setIsSignUp(false);
        setPassword(''); // Clear password for security
      } else {
        console.log('🔄 Attempting login with auth store...');
        await signIn(email, password);
        console.log('✅ Login successful, calling onLoginSuccess');
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Better error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before signing in.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await resetPassword(forgotPasswordEmail);
      Alert.alert(
        'Reset Email Sent! 📧',
        `A password reset link has been sent to ${forgotPasswordEmail}.\n\nCheck your email and click the link to reset your password. The link will open directly in the Shabari app.`,
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
      setForgotPasswordEmail('');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // This would need to be implemented with proper OAuth flow
      Alert.alert('Coming Soon', 'Google Sign-In will be available in a future update');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="shield-check" size={60} color="#ff6b6b" />
          <Text style={styles.logo}>Shabari</Text>
          <Text style={styles.subtitle}>शबरी - Your Digital Guardian</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons 
                  name={isSignUp ? "account-plus" : "login"} 
                  size={20} 
                  color="#ffffff" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.authButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setShowForgotPassword(true)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="google" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setPassword(''); // Clear password when switching
            }}
          >
            <Text style={styles.switchButtonText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="lock-reset" size={40} color="#ff6b6b" />
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalResetButton}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalResetText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 15,
    color: '#ffffff',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4ecdc4',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  googleButton: {
    backgroundColor: '#4285f4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4ecdc4',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 15,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBody: {
    padding: 30,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4ecdc4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: '600',
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalResetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;

