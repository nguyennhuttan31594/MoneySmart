import { createClient } from '@supabase/supabase-js';

export const ACTIVE_SUPABASE_URL = 'https://heoftqkifsgznbokcilh.supabase.co';
export const ACTIVE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb2Z0cWtpZnNnem5ib2tjaWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODc3ODQsImV4cCI6MjEwNTM2Mzc4NH0.DZ7EVLXp_uDfEOjXTaZlc5IOc2TIp9QFAxImet1XBKc';

// HARD FORCE active valid project credentials to guarantee Vercel builds never mix old environment variables
export const supabaseUrl = ACTIVE_SUPABASE_URL;
export const supabaseAnonKey = ACTIVE_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;




