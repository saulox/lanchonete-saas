import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/database';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { status: OrderStatus };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ status: body.status })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
