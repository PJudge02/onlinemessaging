import { createClient } from "@supabase/supabase-js";

export const supabase = createClient('https://deamjoqkudvhztinzmrv.supabase.co',
 `${process.env.SUPABASE_TOKEN}`)