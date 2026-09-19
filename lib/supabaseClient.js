import { createClient } from '@supabase/supabase-js'

const ACTIVE_SUPABASE_URL = 'https://heoftqkifsgznbokcilh.supabase.co';
const ACTIVE_SUPABASE_KEY = 'sb_publishable_d2Z6Ftb2ujegqi2V3rjedQ_4RFyrQoJ';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || url.includes('omdtsbimvdelrvqusksv')) url = ACTIVE_SUPABASE_URL;
if (!key || key.includes('omdtsbimvdelrvqusksv')) key = ACTIVE_SUPABASE_KEY;

export const supabase = createClient(url, key);


