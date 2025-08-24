import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function getUserFromAuthHeader(authHeader?: string) {
  if (!authHeader) return null;
  const [, token] = authHeader.split(' ');
  if (!token) return null;
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error) return null;
  return data.user;
}

