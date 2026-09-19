import { createClient } from '@supabase/supabase-js'

const ACTIVE_SUPABASE_URL = 'https://idrrjewbnwqcmpvfwxno.supabase.co';
const ACTIVE_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcnJqZXdibndxY21wdmZ3eG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTgxNzIsImV4cCI6MjA4ODA5NDE3Mn0.I_xFy6WC9cQzUEgK9kZqUiCMNGeobJhBj8r1I1WEwMI';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || url.includes('omdtsbimvdelrvqusksv')) url = ACTIVE_SUPABASE_URL;
if (!key || key.includes('omdtsbimvdelrvqusksv')) key = ACTIVE_SUPABASE_KEY;

export const supabase = createClient(url, key);

