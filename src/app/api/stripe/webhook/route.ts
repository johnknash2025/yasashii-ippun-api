import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/src/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = (event.data.object as any);
      const userId = sub?.metadata?.user_id || sub?.client_reference_id || sub?.customer_details?.email;
      if (userId) {
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          status: sub.status || 'active',
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          stripe_customer_id: sub.customer || null,
          stripe_subscription_id: sub.id || null,
        }, { onConflict: 'user_id' });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = (event.data.object as any);
      const userId = sub?.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from('subscriptions').update({ status: 'canceled' }).eq('user_id', userId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const runtimeOptions = { body: 'stream' } as const;

