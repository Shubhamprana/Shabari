/**
 * Admin Authentication Utility
 * Handles admin authentication and authorization checks
 */

import { supabase } from '../lib/supabase';

export interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export class AdminAuth {
  /**
   * Check if current user is admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return profile?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get current user's admin profile
   */
  static async getCurrentAdminProfile(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error getting admin profile:', error);
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        is_admin: profile.is_admin,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    } catch (error) {
      console.error('Error getting admin profile:', error);
      return null;
    }
  }

  /**
   * Create admin user (for initial setup)
   */
  static async createAdminUser(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return {
          success: false,
          message: `Auth error: ${authError.message}`,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user account',
        };
      }

      // Create admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          is_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        return {
          success: false,
          message: `Profile error: ${profileError.message}`,
        };
      }

      return {
        success: true,
        message: 'Admin user created successfully',
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      return {
        success: false,
        message: `Error: ${error}`,
      };
    }
  }

  /**
   * Grant admin privileges to existing user
   */
  static async grantAdminPrivileges(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }

      return {
        success: true,
        message: 'Admin privileges granted successfully',
      };
    } catch (error) {
      console.error('Error granting admin privileges:', error);
      return {
        success: false,
        message: `Error: ${error}`,
      };
    }
  }

  /**
   * Revoke admin privileges from user
   */
  static async revokeAdminPrivileges(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }

      return {
        success: true,
        message: 'Admin privileges revoked successfully',
      };
    } catch (error) {
      console.error('Error revoking admin privileges:', error);
      return {
        success: false,
        message: `Error: ${error}`,
      };
    }
  }

  /**
   * Get all admin users
   */
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting admin users:', error);
        return [];
      }

      return data.map(profile => ({
        id: profile.id,
        email: profile.email,
        is_admin: profile.is_admin,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }));
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  /**
   * Check if user has admin privileges (by email)
   */
  static async isUserAdmin(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking user admin status:', error);
        return false;
      }

      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking user admin status:', error);
      return false;
    }
  }
}
