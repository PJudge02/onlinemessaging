import { createClient } from "@supabase/supabase-js";

export const supabase = createClient('https://deamjoqkudvhztinzmrv.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYW1qb3FrdWR2aHp0aW56bXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU1MzI4NjIsImV4cCI6MjAwMTEwODg2Mn0.w_9XhdnJOjbpFVsYmcFVaOt03svaAeDv_nJfRXJR_no')