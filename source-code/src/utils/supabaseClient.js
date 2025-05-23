import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exnnidrnukcaythskszf.supabase.co'; // replace with your URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bm5pZHJudWtjYXl0aHNrc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODM0OTksImV4cCI6MjA2MzU1OTQ5OX0.qBXIG7DJ3Kzn_aFNx5hHygEHgAjjQMRUlhnTZMpToL8'; // replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
