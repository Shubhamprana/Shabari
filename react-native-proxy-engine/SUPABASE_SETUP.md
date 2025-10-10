# Supabase Setup for Shabari Proxy Engine

## Overview

The Shabari Proxy Engine has been configured to use **Supabase** instead of Firebase for consistency with your existing Shabari app setup. This provides a unified database and authentication system.

## Database Tables Required

You need to create the following tables in your Supabase database:

### 1. Fraud Domains Table
```sql
CREATE TABLE fraud_domains (
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
```

### 2. Fraud Numbers Table
```sql
CREATE TABLE fraud_numbers (
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
```

### 3. Fraud IPs Table
```sql
CREATE TABLE fraud_ips (
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
```

### 4. Proxy Reports Table
```sql
CREATE TABLE proxy_reports (
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
```

### 5. Filter Rules Table
```sql
CREATE TABLE filter_rules (
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
```

### 6. Admin Notifications Table
```sql
CREATE TABLE admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  threat_id TEXT,
  threat_type TEXT,
  decision TEXT,
  notes TEXT,
  admin_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Daily Reports Table
```sql
CREATE TABLE daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. User Settings Table
```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_block_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. Devices Table
```sql
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  platform TEXT,
  app_version TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. Statistics Table
```sql
CREATE TABLE statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS on all tables
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
```

## Admin Panel Setup

1. **Access the Admin Panel**: Open `react-native-proxy-engine/admin/supabase-dashboard/index.html` in your browser

2. **Create Admin User**: You need to create a user with admin privileges in your Supabase database:

```sql
-- Create admin user (replace with your email)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@shabari.com', crypt('your_password', gen_salt('bf')), NOW(), NOW(), NOW());

-- Create profile with admin flag
INSERT INTO profiles (id, email, is_admin, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@shabari.com'),
  'admin@shabari.com',
  true,
  NOW(),
  NOW()
);
```

## Environment Variables

The proxy engine will use your existing Supabase configuration from your main app:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Integration with Main App

The proxy engine is now fully integrated with your existing Supabase setup:

1. **Shared Database**: Uses the same Supabase instance as your main app
2. **Shared Authentication**: Uses the same user authentication system
3. **Unified Admin Panel**: Single admin interface for both apps
4. **Consistent Data**: All threat data is stored in the same database

## Testing

1. **Test Database Connection**: Use the `ProxyEngineTestButton` component in your app
2. **Test Admin Panel**: Access the admin dashboard and verify you can log in
3. **Test Threat Reporting**: Use the proxy engine service to report threats
4. **Test Real-time Updates**: Verify that reports appear in the admin panel

## Benefits of Supabase Integration

✅ **Unified Database**: Single source of truth for all data  
✅ **Shared Authentication**: No need for separate admin accounts  
✅ **Real-time Updates**: Live updates across all interfaces  
✅ **Consistent API**: Same Supabase client for all operations  
✅ **Better Performance**: Optimized queries and caching  
✅ **Easier Maintenance**: Single database to manage  

## Next Steps

1. Create the database tables using the SQL scripts above
2. Set up RLS policies for security
3. Create an admin user account
4. Test the integration with your existing app
5. Deploy the admin panel to your web server (optional)

The proxy engine is now fully integrated with your Supabase setup and ready to use! 🚀
