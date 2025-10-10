-- Supabase Database Setup for Shabari Proxy Engine
-- Run this script in your Supabase SQL editor

-- 1. Fraud Domains Table
CREATE TABLE IF NOT EXISTS fraud_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'domain',
  category TEXT DEFAULT 'unknown',
  severity INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  description TEXT,
  report_count INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  warn_count INTEGER DEFAULT 0,
  first_reported BIGINT,
  last_reported BIGINT,
  reporters TEXT[],
  metadata JSONB,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fraud Numbers Table
CREATE TABLE IF NOT EXISTS fraud_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'phone',
  category TEXT DEFAULT 'unknown',
  severity INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  description TEXT,
  report_count INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  warn_count INTEGER DEFAULT 0,
  first_reported BIGINT,
  last_reported BIGINT,
  reporters TEXT[],
  metadata JSONB,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fraud IPs Table
CREATE TABLE IF NOT EXISTS fraud_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  range TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'ip',
  category TEXT DEFAULT 'unknown',
  severity INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  description TEXT,
  report_count INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  warn_count INTEGER DEFAULT 0,
  first_reported BIGINT,
  last_reported BIGINT,
  reporters TEXT[],
  metadata JSONB,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Proxy Reports Table
CREATE TABLE IF NOT EXISTS proxy_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target TEXT NOT NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  device_id TEXT,
  details TEXT,
  timestamp BIGINT NOT NULL,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  review_decision TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Filter Rules Table
CREATE TABLE IF NOT EXISTS filter_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  pattern TEXT NOT NULL,
  action TEXT NOT NULL,
  priority INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  threat_id TEXT,
  threat_type TEXT,
  decision TEXT,
  notes TEXT,
  admin_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Daily Reports Table
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_block_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  platform TEXT,
  app_version TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Statistics Table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fraud_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access for fraud_domains" ON fraud_domains;
DROP POLICY IF EXISTS "Public read access for fraud_numbers" ON fraud_numbers;
DROP POLICY IF EXISTS "Public read access for fraud_ips" ON fraud_ips;
DROP POLICY IF EXISTS "Public read access for filter_rules" ON filter_rules;
DROP POLICY IF EXISTS "Public read access for statistics" ON statistics;
DROP POLICY IF EXISTS "Users can create reports" ON proxy_reports;
DROP POLICY IF EXISTS "Users can read own reports" ON proxy_reports;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own devices" ON devices;

-- Public read access for threat checking
CREATE POLICY "Public read access for fraud_domains" ON fraud_domains FOR SELECT USING (true);
CREATE POLICY "Public read access for fraud_numbers" ON fraud_numbers FOR SELECT USING (true);
CREATE POLICY "Public read access for fraud_ips" ON fraud_ips FOR SELECT USING (true);
CREATE POLICY "Public read access for filter_rules" ON filter_rules FOR SELECT USING (true);
CREATE POLICY "Public read access for statistics" ON statistics FOR SELECT USING (true);

-- Authenticated users can create reports
CREATE POLICY "Users can create reports" ON proxy_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own reports
CREATE POLICY "Users can read own reports" ON proxy_reports FOR SELECT USING (auth.uid()::text = device_id);

-- Users can manage their own settings
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own devices
CREATE POLICY "Users can manage own devices" ON devices FOR ALL USING (auth.uid()::text = device_id);

-- Insert some sample data
INSERT INTO fraud_domains (domain, category, severity, description) VALUES
('malicious-site.com', 'phishing', 90, 'Known phishing site'),
('scam-website.net', 'scam', 85, 'Fraudulent website'),
('fake-bank.org', 'phishing', 95, 'Banking phishing site')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO fraud_numbers (number, category, severity, description) VALUES
('+1-900-123-4567', 'premium_rate', 80, 'Premium rate scam number'),
('+234-123-456-7890', 'known_scam', 90, 'Known Nigerian scam number'),
('+91-987-654-3210', 'tech_support_scam', 85, 'Tech support scam')
ON CONFLICT (number) DO NOTHING;

INSERT INTO fraud_ips (range, category, severity, description) VALUES
('192.168.1.100', 'malware', 80, 'Known malware IP'),
('10.0.0.50', 'phishing', 75, 'Phishing server IP'),
('172.16.0.25', 'scam', 85, 'Scam server IP')
ON CONFLICT (range) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fraud_domains_active ON fraud_domains(active);
CREATE INDEX IF NOT EXISTS idx_fraud_domains_severity ON fraud_domains(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_numbers_active ON fraud_numbers(active);
CREATE INDEX IF NOT EXISTS idx_fraud_numbers_severity ON fraud_numbers(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_ips_active ON fraud_ips(active);
CREATE INDEX IF NOT EXISTS idx_fraud_ips_severity ON fraud_ips(severity);
CREATE INDEX IF NOT EXISTS idx_proxy_reports_timestamp ON proxy_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_proxy_reports_type ON proxy_reports(type);

-- Success message
SELECT 'Supabase tables created successfully for Shabari Proxy Engine!' as message;
