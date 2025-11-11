import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量。请检查.env文件配置。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名
export const AUDIO_FILES_TABLE = 'audio_files';

// 存储桶名
export const AUDIO_BUCKET = 'audio-files';
