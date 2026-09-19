import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://idrrjewbnwqcmpvfwxno.supabase.co';
const ACTIVE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcnJqZXdibndxY21wdmZ3eG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTgxNzIsImV4cCI6MjA4ODA5NDE3Mn0.I_xFy6WC9cQzUEgK9kZqUiCMNGeobJhBj8r1I1WEwMI';

let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prevent stale or dead Supabase project URLs (like omdtsbimvdelrvqusksv) from breaking production
if (!envUrl || envUrl.includes('omdtsbimvdelrvqusksv')) {
  envUrl = ACTIVE_SUPABASE_URL;
}
if (!envKey || envKey.includes('omdtsbimvdelrvqusksv')) {
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

