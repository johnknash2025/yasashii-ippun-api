import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/src/middleware/cors';
import { getUserFromAuthHeader, supabaseAdmin } from '@/src/lib/supabase';
import { z } from 'zod';

export const runtime = 'nodejs';

const Body = z.object({ tone: z.enum(['gentle', 'relax']).default('gentle'), prompt: z.string().optional() });

async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') return NextResponse.json({}, { status: 200 });
  const user = await getUserFromAuthHeader(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  // Check subscription
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  const plan = sub ? 'pro' : 'free';

  // TODO: rate limit & usage accounting

  // Placeholder generation (replace with actual model call on server)
  const phrases = {
    gentle: [
      '無理しなくて大丈夫。あなたのペースで十分ですよ。',
      '小さな前進も大切です。今日はそれで十分。',
    ],
    relax: [
      '深呼吸して、肩の力をそっと抜きましょう。',
      '今この瞬間だけ、静かな場所に心を置いてみて。',
    ],
  } as const;
  const list = phrases[body.data.tone];
  const text = list[Math.floor(Math.random() * list.length)];

  return NextResponse.json({ text, plan });
}

export const POST = withCors(handler);
export const OPTIONS = withCors(handler);

