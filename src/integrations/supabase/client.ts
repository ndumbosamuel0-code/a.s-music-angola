// Supabase client pinned to the A.S MUSIC ANGOLA project.
// Keep the publishable key in Lovable environment secrets; never place a secret/service-role key here.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL = 'https://hvwubckihjuljlhgaial.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VkmE4w0_-La9UtBpgfMI0w_3NLEwM_H';

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // Publishable keys are opaque strings, not bearer JWTs.
    if (
      (supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('sb_secret_')) &&
      headers.get('Authorization') === `Bearer ${supabaseKey}`
    ) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    const message = 'Missing Supabase environment variable: SUPABASE_PUBLISHABLE_KEY. Connect the project in Lovable Cloud.';
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the Supabase client like this:
// import { supabase } from '@/integrations/supabase/client';
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
