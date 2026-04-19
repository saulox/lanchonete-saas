import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWebhookAuthorized } from '@/lib/payments';
import type { PaymentWebhookPayload } from '@/lib/payments';

export async function POST(request: Request) {
  const signature = request.headers.get('x-webhook-secret');

  if (!isWebhookAuthorized(signature)) {
    return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const body = (await request.json()) as PaymentWebhookPayload;

  if (!body.order_id || !body.status) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const supabase = await createClient();

  const updates: {
    payment_status: PaymentWebhookPayload['status'];
    payment_reference?: string | null;
    payment_provider?: string | null;
    paid_at?: string | null;
  } = {
    payment_status: body.status,
    payment_reference: body.reference ?? null,
    payment_provider: body.provider ?? null
  };

  if (body.status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }

  if (body.status === 'failed' || body.status === 'refunded') {
    updates.paid_at = null;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', body.order_id)
    .select('id, payment_status, payment_reference, payment_provider, paid_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
