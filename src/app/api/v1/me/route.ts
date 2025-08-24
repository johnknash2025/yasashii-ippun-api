import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/src/middleware/cors';
import { getUserFromAuthHeader, supabaseAdmin } from '@/src/lib/supabase';

export const runtime = 'nodejs';

async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') return NextResponse.json({}, { status: 200 });
  const user = await getUserFromAuthHeader(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch subscription and usage
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const plan = sub ? 'pro' : 'free';
  return NextResponse.json({ user: { id: user.id, email: user.email }, plan });
}

export const GET = withCors(handler);
export const OPTIONS = withCors(handler);

