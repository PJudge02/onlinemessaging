import { createClient } from "@supabase/supabase-js";

const supabaseKey = process.env.NEXT_PUBLIC_APP_SUPABASE_ANON_KEY
export const supabase = createClient('https://dexupvendkrydoaewghb.supabase.co', supabaseKey)