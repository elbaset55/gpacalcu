import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Supabase is not configured. Contact support.');
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized');
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new Error('Unauthorized');
    }

    // Create a per-request Supabase client scoped to this token
    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Validate the JWT — getUser() verifies signature server-side
    // We pass the token explicitly to avoid any cached session state
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      // Do NOT leak token or error details to the caller
      throw new Error('Unauthorized');
    }

    return next({
      context: {
        supabase,
        userId: data.user.id,
        user: data.user,
      },
    });
  },
);
