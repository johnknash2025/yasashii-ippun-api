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

  // Find or create customer by user id
  const search = await stripe.customers.search({ query: `metadata['user_id']:'${user.id}'` });
  let customer = search.data[0];
  if (!customer) {
    customer = await stripe.customers.create({ metadata: { user_id: user.id }, email: user.email || undefined });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return NextResponse.json({ url: portal.url });
}

export const POST = withCors(handler);
export const OPTIONS = withCors(handler);

