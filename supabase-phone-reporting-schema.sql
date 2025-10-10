-- Supabase Database Schema for Phone Number Reporting
-- Run this script in your Supabase SQL editor

-- 1. Phone Reports Table (stores user reports)
CREATE TABLE IF NOT EXISTS phone_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spam', 'fraud', 'telemarketer', 'other')),
  description TEXT NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}',
  reviewed BOOLEAN DEFAULT false,
  review_decision TEXT CHECK (review_decision IN ('approved', 'rejected', 'pending')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Phone Reputation Table (aggregated reputation data)
CREATE TABLE IF NOT EXISTS phone_reputation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  spam_reports INTEGER DEFAULT 0,
  fraud_reports INTEGER DEFAULT 0,
  telemarketer_reports INTEGER DEFAULT 0,
  legitimate_reports INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  category TEXT DEFAULT 'unknown',
  is_verified_business BOOLEAN DEFAULT false,
  caller_name TEXT,
  business_info JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_reports_updated_at 
    BEFORE UPDATE ON phone_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_reputation_updated_at 
    BEFORE UPDATE ON phone_reputation 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_reports_phone_number ON phone_reports(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_reports_reported_by ON phone_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_phone_reports_category ON phone_reports(category);
CREATE INDEX IF NOT EXISTS idx_phone_reports_created_at ON phone_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_reports_reviewed ON phone_reports(reviewed);

CREATE INDEX IF NOT EXISTS idx_phone_reputation_number ON phone_reputation(number);
CREATE INDEX IF NOT EXISTS idx_phone_reputation_score ON phone_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_phone_reputation_category ON phone_reputation(category);

-- 5. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE phone_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_reputation ENABLE ROW LEVEL SECURITY;

-- Phone Reports Policies
-- Users can insert their own reports
CREATE POLICY "Users can create phone reports" ON phone_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON phone_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON phone_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update reports (for review)
CREATE POLICY "Admins can update reports" ON phone_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Phone Reputation Policies
-- Everyone can read reputation data (for checking numbers)
CREATE POLICY "Anyone can read phone reputation" ON phone_reputation
  FOR SELECT USING (true);

-- Only admins can directly modify reputation data
CREATE POLICY "Admins can modify phone reputation" ON phone_reputation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can modify reputation (for automated updates)
CREATE POLICY "Service can modify phone reputation" ON phone_reputation
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Function to automatically update reputation when reports are approved
CREATE OR REPLACE FUNCTION update_reputation_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when report is approved
  IF NEW.review_decision = 'approved' AND OLD.review_decision != 'approved' THEN
    -- Update or insert reputation record
    INSERT INTO phone_reputation (
      number,
      spam_reports,
      fraud_reports,
      telemarketer_reports,
      total_reports,
      category,
      reputation_score
    )
    VALUES (
      NEW.phone_number,
      CASE WHEN NEW.category = 'spam' THEN 1 ELSE 0 END,
      CASE WHEN NEW.category = 'fraud' THEN 1 ELSE 0 END,
      CASE WHEN NEW.category = 'telemarketer' THEN 1 ELSE 0 END,
      1,
      NEW.category,
      CASE WHEN NEW.category IN ('spam', 'fraud') THEN 30 ELSE 50 END
    )
    ON CONFLICT (number) DO UPDATE SET
      spam_reports = phone_reputation.spam_reports + CASE WHEN NEW.category = 'spam' THEN 1 ELSE 0 END,
      fraud_reports = phone_reputation.fraud_reports + CASE WHEN NEW.category = 'fraud' THEN 1 ELSE 0 END,
      telemarketer_reports = phone_reputation.telemarketer_reports + CASE WHEN NEW.category = 'telemarketer' THEN 1 ELSE 0 END,
      total_reports = phone_reputation.total_reports + 1,
      reputation_score = GREATEST(0, 100 - ((phone_reputation.spam_reports + phone_reputation.fraud_reports + CASE WHEN NEW.category IN ('spam', 'fraud') THEN 1 ELSE 0 END) * 100.0 / (phone_reputation.total_reports + 1))),
      category = CASE 
        WHEN phone_reputation.fraud_reports + CASE WHEN NEW.category = 'fraud' THEN 1 ELSE 0 END > phone_reputation.spam_reports + CASE WHEN NEW.category = 'spam' THEN 1 ELSE 0 END 
             AND phone_reputation.fraud_reports + CASE WHEN NEW.category = 'fraud' THEN 1 ELSE 0 END > phone_reputation.telemarketer_reports + CASE WHEN NEW.category = 'telemarketer' THEN 1 ELSE 0 END 
        THEN 'fraud'
        WHEN phone_reputation.spam_reports + CASE WHEN NEW.category = 'spam' THEN 1 ELSE 0 END > phone_reputation.telemarketer_reports + CASE WHEN NEW.category = 'telemarketer' THEN 1 ELSE 0 END
        THEN 'spam'
        ELSE 'telemarketer'
      END,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reputation_on_report_approval
  AFTER UPDATE ON phone_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_approval();

-- 7. Sample data for testing (optional)
-- INSERT INTO phone_reputation (number, reputation_score, spam_reports, total_reports, category) VALUES
--   ('+1234567890', 10, 15, 20, 'spam'),
--   ('+0987654321', 20, 8, 12, 'fraud'),
--   ('+1122334455', 85, 1, 10, 'telemarketer');

-- 8. View for admin dashboard
CREATE OR REPLACE VIEW admin_phone_reports_summary AS
SELECT 
  pr.id,
  pr.phone_number,
  pr.category,
  pr.description,
  pr.reviewed,
  pr.review_decision,
  pr.created_at,
  u.email as reporter_email,
  rep.reputation_score,
  rep.total_reports as existing_reports
FROM phone_reports pr
LEFT JOIN auth.users u ON pr.reported_by = u.id
LEFT JOIN phone_reputation rep ON pr.phone_number = rep.number
ORDER BY pr.created_at DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON phone_reports TO authenticated;
GRANT ALL ON phone_reputation TO authenticated;
GRANT SELECT ON admin_phone_reports_summary TO authenticated;
