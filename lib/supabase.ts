import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://heoftqkifsgznbokcilh.supabase.co';
const ACTIVE_SUPABASE_KEY = 'sb_publishable_d2Z6Ftb2ujegqi2V3rjedQ_4RFyrQoJ';

let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prevent stale or dead Supabase project URLs from breaking production
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


