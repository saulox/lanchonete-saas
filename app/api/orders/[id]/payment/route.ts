import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PaymentStatus } from '@/types/database';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { payment_status: PaymentStatus };
  const supabase = await createClient();

  const updates: { payment_status: PaymentStatus; paid_at?: string | null } = {
    payment_status: body.payment_status
  };

  if (body.payment_status === 'paid') {
    updates.paid_at = new Date().toISOString();
  }

  if (body.payment_status === 'failed' || body.payment_status === 'refunded') {
    updates.paid_at = null;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('id, payment_status, paid_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
