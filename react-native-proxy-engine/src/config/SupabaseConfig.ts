/**
 * Supabase Configuration for Shabari Proxy Engine
 * This replaces Firebase with Supabase for consistency with the main app
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment or use defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://mynbtxrbqbmhxvaimfhs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJ0eHJicWJtaHh2YWltZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI1NzEsImV4cCI6MjA2NTQwODU3MX0.c8K9g6NsT3MjYMcQYiSAzP8Tb05OYzY5WPHPrq-HJL0';

// Create Supabase client for proxy engine
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database table names for proxy engine
export const TABLES = {
  FRAUD_DOMAINS: 'fraud_domains',
  FRAUD_NUMBERS: 'fraud_numbers', 
  FRAUD_IPS: 'fraud_ips',
  REPORTS: 'proxy_reports',
  FILTER_RULES: 'filter_rules',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  AUDIT_LOGS: 'audit_logs',
  DAILY_REPORTS: 'daily_reports',
  USER_SETTINGS: 'user_settings',
  DEVICES: 'devices',
  STATISTICS: 'statistics',
} as const;

// Threat detection thresholds
export const THREAT_THRESHOLDS = {
  BLOCK: 80,
  WARN: 50,
  MONITOR: 30,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  MAX_REPORTS_PER_HOUR: 100,
  MAX_REPORTS_PER_DAY: 1000,
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  ENCRYPTION_SALT: 'shabari_salt_2024',
  JWT_SECRET: process.env.JWT_SECRET || 'shabari_jwt_secret_2024',
} as const;

// DNS configuration
export const DNS_CONFIG = {
  PRIMARY_DNS: '8.8.8.8',
  SECONDARY_DNS: '8.8.4.4',
  LOCAL_DNS_PORT: 5353,
} as const;

// VPN configuration
export const VPN_CONFIG = {
  SERVICE_NAME: 'ShabariProtection',
  NOTIFICATION_TITLE: 'Shabari Protection Active',
  NOTIFICATION_TEXT: 'Your device is protected from threats',
} as const;

// Admin configuration
export const ADMIN_CONFIG = {
  EMAIL: process.env.ADMIN_EMAIL || 'admin@shabari.com',
  PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
} as const;

// Export all configuration
export const PROXY_ENGINE_CONFIG = {
  supabase,
  TABLES,
  THREAT_THRESHOLDS,
  RATE_LIMITS,
  SECURITY_CONFIG,
  DNS_CONFIG,
  VPN_CONFIG,
  ADMIN_CONFIG,
} as const;

export default PROXY_ENGINE_CONFIG;
