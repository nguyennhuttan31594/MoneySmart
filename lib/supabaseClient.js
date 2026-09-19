import { createClient } from '@supabase/supabase-js'

const ACTIVE_SUPABASE_URL = 'https://heoftqkifsgznbokcilh.supabase.co';
const ACTIVE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlb2Z0cWtpZnNnem5ib2tjaWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODc3ODQsImV4cCI6MjEwNTM2Mzc4NH0.DZ7EVLXp_uDfEOjXTaZlc5IOc2TIp9QFAxImet1XBKc';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || url.includes('omdtsbimvdelrvqusksv')) url = ACTIVE_SUPABASE_URL;
if (!key || key.includes('omdtsbimvdelrvqusksv') || key.startsWith('sb_publishable')) key = ACTIVE_SUPABASE_KEY;

export const supabase = createClient(url, key);



