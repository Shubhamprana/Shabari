import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mynbtxrbqbmhxvaimfhs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJ0eHJicWJtaHh2YWltZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI1NzEsImV4cCI6MjA2NTQwODU3MX0.c8K9g6NsT3MjYMcQYiSAzP8Tb05OYzY5WPHPrq-HJL0';

// Check if AsyncStorage is available (React Native) or use localStorage (Web)
let storage: any;
try {
  storage = AsyncStorage;
  console.log('✅ Using AsyncStorage for session persistence');
} catch (error) {
  console.log('⚠️ AsyncStorage not available, using localStorage fallback');
  storage = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence
    persistSession: true,
    // Automatically refresh tokens
    autoRefreshToken: true,
    // Use AsyncStorage for React Native or localStorage for web
    storage: storage,
    // Detect session from URL (useful for email confirmations)
    detectSessionInUrl: true,
    // Flow type for authentication
    flowType: 'pkce'
  },
  // Enable real-time features
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface User {
  id: string;
  email: string;
  created_at: string;
  is_premium: boolean;
  subscription_expires_at?: string;
}

export interface ScanResult {
  id: string;
  user_id: string;
  file_name: string;
  file_hash: string;
  scan_result: 'safe' | 'dangerous' | 'suspicious';
  threat_name?: string;
  created_at: string;
}

