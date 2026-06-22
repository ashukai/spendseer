import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,       // keep session in localStorage
    autoRefreshToken: true,     // silently refresh before expiry
    detectSessionInUrl: true,   // needed for magic links / OAuth redirects
  },
})
