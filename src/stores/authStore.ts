import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendEmailVerification, sendPasswordReset, supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  is_premium: boolean;
  subscription_expires_at?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setSessionInitialized: (initialized: boolean) => void;
}

// Check if AsyncStorage is available for persistence
let authStorage: any;
try {
  authStorage = AsyncStorage;
} catch (error) {
  // Fallback for web
  authStorage = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      sessionInitialized: false,

      clearError: () => set({ error: null }),
      
      setSessionInitialized: (initialized: boolean) => set({ sessionInitialized: initialized }),

      signIn: async (email: string, password: string) => {
        console.log('🔄 AuthStore: Starting sign in process...');
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            console.log('✅ AuthStore: Supabase sign in successful');
            
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.warn('⚠️ AuthStore: Profile fetch error:', profileError);
            }

            const userData = profile || {
              id: data.user.id,
              email: data.user.email!,
              created_at: data.user.created_at!,
              is_premium: false,
            };

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            console.log('✅ AuthStore: User state updated successfully');
          }
        } catch (error: any) {
          console.error('❌ AuthStore: Sign in error:', error);
          set({ error: error.message, isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      signUp: async (email: string, password: string) => {
        console.log('🔄 AuthStore: Starting sign up process...');
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await sendEmailVerification(email, password);

          if (error) throw error;

          set({ isLoading: false });
          console.log('✅ AuthStore: Sign up successful, verification email sent');
        } catch (error: any) {
          console.error('❌ AuthStore: Sign up error:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        console.log('🔄 AuthStore: Starting password reset...');
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await sendPasswordReset(email);

          if (error) throw error;

          set({ isLoading: false });
          console.log('✅ AuthStore: Password reset email sent');
        } catch (error: any) {
          console.error('❌ AuthStore: Password reset error:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        console.log('🔄 AuthStore: Starting sign out process...');
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          // Clear all auth state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionInitialized: true, // Keep initialized to prevent loading screen
          });

          // Clear any stored auth data
          try {
            await authStorage.removeItem('auth-storage');
            console.log('🗑️ AuthStore: Cleared stored auth data');
          } catch (storageError) {
            console.warn('⚠️ AuthStore: Failed to clear storage:', storageError);
          }

          console.log('✅ AuthStore: Sign out successful');
        } catch (error: any) {
          console.error('❌ AuthStore: Sign out error:', error);
          set({ error: error.message, isLoading: false });
          
          // Even if signOut fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionInitialized: true,
          });
          
          throw error;
        }
      },

      checkAuth: async () => {
        console.log('🔄 AuthStore: Checking authentication status...');
        set({ isLoading: true, error: null });
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ AuthStore: Session error:', sessionError);
            throw sessionError;
          }
          
          if (session?.user) {
            console.log('✅ AuthStore: Valid session found');
            
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.warn('⚠️ AuthStore: Profile fetch error:', profileError);
            }

            const userData = profile || {
              id: session.user.id,
              email: session.user.email!,
              created_at: session.user.created_at!,
              is_premium: false,
            };

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              sessionInitialized: true,
            });

            console.log('✅ AuthStore: Authentication restored from session');
          } else {
            console.log('ℹ️ AuthStore: No valid session found');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              sessionInitialized: true,
            });
          }
        } catch (error: any) {
          console.error('❌ AuthStore: Auth check error:', error);
          set({
            error: error.message,
            isLoading: false,
            user: null,
            isAuthenticated: false,
            sessionInitialized: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          try {
            const value = await authStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.warn('⚠️ AuthStore: Failed to get stored auth data:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            await authStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('⚠️ AuthStore: Failed to store auth data:', error);
          }
        },
        removeItem: async (name) => {
          try {
            await authStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ AuthStore: Failed to remove auth data:', error);
          }
        },
      },
      // Skip persisting loading states and functions
    }
  )
);

// Set up Supabase auth state listener
let authListenerInitialized = false;

export const initializeAuthListener = () => {
  if (authListenerInitialized) {
    console.log('ℹ️ AuthStore: Auth listener already initialized');
    return;
  }

  console.log('🔄 AuthStore: Setting up auth state listener...');
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔄 AuthStore: Auth state changed:', event, session?.user?.email);
      
      const store = useAuthStore.getState();
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            console.log('✅ AuthStore: User signed in via listener');
            
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.warn('⚠️ AuthStore: Profile fetch error in listener:', profileError);
            }

            const userData = profile || {
              id: session.user.id,
              email: session.user.email!,
              created_at: session.user.created_at!,
              is_premium: false,
            };

            useAuthStore.setState({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              sessionInitialized: true,
            });
          }
          break;

        case 'SIGNED_OUT':
          console.log('👋 AuthStore: User signed out via listener');
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionInitialized: true,
          });
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 AuthStore: Token refreshed');
          // Session is automatically updated by Supabase
          break;

        case 'USER_UPDATED':
          console.log('🔄 AuthStore: User data updated');
          if (session?.user && store.isAuthenticated) {
            // Re-fetch user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              useAuthStore.setState({ user: profile });
            }
          }
          break;
      }
    }
  );

  authListenerInitialized = true;
  console.log('✅ AuthStore: Auth listener initialized successfully');

  // Return cleanup function
  return () => {
    console.log('🔄 AuthStore: Cleaning up auth listener');
    subscription.unsubscribe();
    authListenerInitialized = false;
  };
};

