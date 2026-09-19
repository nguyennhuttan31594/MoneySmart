import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://heoftqkifsgznbokcilh.supabase.co';
const ACTIVE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb2Z0cWtpZnNnem5ib2tjaWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODc3ODQsImV4cCI6MjEwNTM2Mzc4NH0.DZ7EVLXp_uDfEOjXTaZlc5IOc2TIp9QFAxImet1XBKc';

let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prevent stale or dead Supabase project URLs from breaking production
if (!envUrl || envUrl.includes('omdtsbimvdelrvqusksv')) {
  envUrl = ACTIVE_SUPABASE_URL;
}
if (!envKey || envKey.includes('omdtsbimvdelrvqusksv') || envKey.startsWith('sb_publishable')) {
  envKey = ACTIVE_SUPABASE_KEY;
}

export const supabaseUrl = envUrl;
export const supabaseAnonKey = envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;



