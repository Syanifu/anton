import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

// Create a Supabase client for browser-side authentication
export function createSupabaseBrowserClient(): SupabaseClient {
    // Return cached client if available
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if env vars are available (they won't be during SSR/build)
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables not available');
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
}
