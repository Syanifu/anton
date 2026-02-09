import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Lazy-initialize Supabase client (avoids build-time errors)
export function getSupabase(): SupabaseClient {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
    }
    return supabaseInstance;
}
