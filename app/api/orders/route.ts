import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildPaymentReference, buildPixCopyPaste, getPixConfig } from '@/lib/payments';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

function isPromotionActive(startsAt?: string | null, endsAt?: string | null) {
  const now = new Date();
  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) < now) return false;
  return true;
}

function getInitialPaymentStatus(paymentMethod: PaymentMethod): PaymentStatus {
  if (paymentMethod === 'pix') return 'awaiting_confirmation';
  return 'pending';
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, stores(name), order_items(*)')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    store_id: string;
    customer_name: string;
    phone: string;
    notes?: string;
    accepts_promotions?: boolean;
    payment_method?: PaymentMethod;
    coupon_code?: string;
    items: Array<{ product_id?: string; product_name: string; quantity: number; unit_price: number }>;
  };

  if (!body.store_id || !body.customer_name || !body.phone || !body.items?.length) {
    return NextResponse.json({ error: 'Dados obrigatórios não informados.' }, { status: 400 });
  }

  const paymentMethod = body.payment_method ?? 'pix';
  const subtotal = body.items.reduce((acc, item) => acc + Number(item.unit_price) * Number(item.quantity), 0);
  if (subtotal <= 0) {
    return NextResponse.json({ error: 'Subtotal inválido.' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('phone', body.phone).maybeSingle();

  let appliedCoupon: string | null = null;
  let discountPercent = 0;

  if (body.coupon_code) {
    const coupon = body.coupon_code.trim().toUpperCase();
    const { data: promotion } = await supabase
      .from('promotions')
      .select('code, discount_percent, active, starts_at, ends_at')
      .eq('store_id', body.store_id)
      .eq('code', coupon)
      .maybeSingle();

    if (!promotion || !promotion.active || !isPromotionActive(promotion.starts_at, promotion.ends_at)) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado.' }, { status: 400 });
    }

    appliedCoupon = promotion.code;
    discountPercent = Number(promotion.discount_percent ?? 0);
  }

  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const totalAmount = Number(Math.max(subtotal - discountAmount, 0).toFixed(2));

  const { qrCodeUrl, providerName } = getPixConfig();
  const paymentReference = buildPaymentReference(crypto.randomUUID());

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: body.store_id,
      customer_id: existingProfile?.id ?? null,
      customer_name: body.customer_name,
      phone: body.phone,
      notes: body.notes,
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      coupon_code: appliedCoupon,
      payment_method: paymentMethod,
      payment_status: getInitialPaymentStatus(paymentMethod),
      payment_reference: paymentReference,
      payment_provider: paymentMethod === 'pix' ? providerName : null,
      pix_copy_paste: null,
      pix_qr_code_url: paymentMethod === 'pix' ? qrCodeUrl || null : null,
      status: 'pending'
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Erro ao criar pedido.' }, { status: 400 });
  }

  const items = body.items.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabase.from('order_items').insert(items);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  if (paymentMethod === 'pix') {
    const pixCopyPaste = buildPixCopyPaste(order.id, totalAmount);

    if (pixCopyPaste) {
      await supabase.from('orders').update({ pix_copy_paste: pixCopyPaste }).eq('id', order.id);
      order.pix_copy_paste = pixCopyPaste;
    }
  }

  if (body.accepts_promotions) {
    await supabase.from('marketing_leads').upsert(
      {
        store_id: body.store_id,
        phone: body.phone,
        full_name: body.customer_name,
        accepts_promotions: true
      },
      { onConflict: 'store_id,phone' }
    );
  }

  return NextResponse.json(
    {
      data: order,
      pricing: {
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        coupon_code: appliedCoupon
      }
    },
    { status: 201 }
  );
}
