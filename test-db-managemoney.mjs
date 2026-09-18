import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- Kiểm tra kết nối Supabase cho ManageMoney ---');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('categories').select('*').limit(5);
    
    if (error) {
      console.log('Status Code/Error:', error.code || 'ERR', error.message);
    } else {
      console.log('✅ KẾT NỐI THÀNH CÔNG! Dữ liệu bảng categories:');
      console.log(data);
    }
  } catch (err) {
    console.error('❌ LỖI KẾT NỐI:', err.message);
  }
}

testConnection();
