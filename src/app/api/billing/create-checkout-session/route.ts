import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/src/middleware/cors';
import { getUserFromAuthHeader } from '@/src/lib/supabase';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') return NextResponse.json({}, { status: 200 });
  const user = await getUserFromAuthHeader(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.STRIPE_PRICE_ID_PRO) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/cancel`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
  });
  return NextResponse.json({ url: session.url });
}

export const POST = withCors(handler);
export const OPTIONS = withCors(handler);

