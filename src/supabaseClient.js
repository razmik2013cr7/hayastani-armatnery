import { createClient } from '@supabase/supabase-js'

// Public anon key — safe to ship to the browser. Values fall back to the
// project's defaults so a fresh checkout works even without a .env file.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://xpodpnzdwkmeticzbvvb.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2Rwbnpkd2ttZXRpY3pidnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODM2NjksImV4cCI6MjEwNDQ1OTY2OX0.t6gDfDCt-z5LNa8Q4smW_6L5pLce1ppqEaDU_TLh6BM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
