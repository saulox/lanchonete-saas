import { OrderBoard } from '@/components/order-board';
import { createClient } from '@/lib/supabase/server';
import { getCurrentStore } from '@/lib/store';

export default async function OperationsPage() {
  const supabase = await createClient();
  const store = await getCurrentStore();

  const query = supabase
    .from('orders')
    .select('id, customer_name, phone, status, subtotal_amount, discount_amount, total_amount, coupon_code, payment_method, payment_status, payment_reference, paid_at, notes, created_at, stores(name)')
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: orders } = store ? await query.eq('store_id', store.id) : await query;

  const normalizedOrders = ((orders as any[]) ?? []).map((order) => ({
    ...order,
    store_name: order.stores?.name ?? null
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Fila em tempo real</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Monitoramento de pedidos</h1>
        <p className="mt-2 text-sm text-slate-500">Use esta tela no PC do caixa, produção ou monitor de despacho.</p>
        {store ? <p className="mt-1 text-sm text-slate-400">Loja ativa: {store.name}</p> : null}
      </div>

      <OrderBoard initialOrders={normalizedOrders} storeId={store?.id} />
    </div>
  );
}
