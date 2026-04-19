'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/database';
import { currency, formatPhone, paymentMethodLabel, paymentStatusLabel } from '@/lib/utils';

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  store_name?: string | null;
};

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Novo',
  preparing: 'Em preparo',
  ready: 'Pronto',
  completed: 'Finalizado',
  cancelled: 'Cancelado'
};

const flows: Array<{ current: OrderStatus; next: OrderStatus; label: string }> = [
  { current: 'pending', next: 'preparing', label: 'Iniciar preparo' },
  { current: 'preparing', next: 'ready', label: 'Marcar pronto' },
  { current: 'ready', next: 'completed', label: 'Finalizar' }
];

export function OrderBoard({ initialOrders, storeId }: { initialOrders: Order[]; storeId?: string }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reloadOrders() {
    const supabase = createClient();
    let query = supabase
      .from('orders')
      .select(
        'id, customer_name, phone, status, subtotal_amount, discount_amount, total_amount, coupon_code, payment_method, payment_status, payment_reference, paid_at, notes, created_at, stores(name)'
      )
      .order('created_at', { ascending: false })
      .limit(30);

    if (storeId) query = query.eq('store_id', storeId);

    const { data } = await query;

    if (data) {
      setOrders(
        data.map((order: any) => ({
          ...order,
          store_name: order.stores?.name ?? null
        })) as Order[]
      );
    }
  }

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('orders-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        await reloadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setLoadingId(orderId + status);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await reloadOrders();
    } finally {
      setLoadingId(null);
    }
  }

  async function changePayment(orderId: string, payment_status: PaymentStatus) {
    setLoadingId(orderId + payment_status);
    try {
      await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status })
      });
      await reloadOrders();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {orders.map((order) => {
        const nextAction = flows.find((flow) => flow.current === order.status);

        return (
          <article key={order.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pedido #{order.id.slice(0, 8)}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{order.customer_name}</h3>
                <p className="text-sm text-slate-500">{formatPhone(order.phone)}</p>
                {order.store_name ? <p className="mt-1 text-xs text-slate-400">Loja: {order.store_name}</p> : null}
              </div>
              <span className="badge bg-orange-100 text-orange-700">{statusLabel[order.status]}</span>
            </div>
            <div className="mt-3 grid gap-1 text-sm text-slate-600">
              <p><strong>Pagamento:</strong> {paymentMethodLabel(order.payment_method)}</p>
              <p><strong>Status pagamento:</strong> {paymentStatusLabel(order.payment_status)}</p>
              {order.payment_reference ? <p><strong>Ref.:</strong> {order.payment_reference}</p> : null}
              {order.paid_at ? <p><strong>Pago em:</strong> {new Date(order.paid_at).toLocaleString('pt-BR')}</p> : null}
              {order.coupon_code ? <p><strong>Cupom:</strong> {order.coupon_code}</p> : null}
              {order.notes ? <p><strong>Obs:</strong> {order.notes}</p> : null}
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Subtotal</span><strong>{currency(Number(order.subtotal_amount ?? order.total_amount))}</strong></div>
              <div className="mt-1 flex items-center justify-between"><span>Desconto</span><strong className="text-emerald-600">- {currency(Number(order.discount_amount ?? 0))}</strong></div>
              <div className="mt-1 flex items-center justify-between text-slate-900"><span>Total</span><strong>{currency(Number(order.total_amount))}</strong></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <strong className="text-slate-900">{currency(Number(order.total_amount))}</strong>
            </div>

            <div className="mt-4 grid gap-2">
              {nextAction ? (
                <button
                  className="btn-primary"
                  disabled={loadingId === order.id + nextAction.next}
                  onClick={() => changeStatus(order.id, nextAction.next)}
                >
                  {loadingId === order.id + nextAction.next ? 'Atualizando...' : nextAction.label}
                </button>
              ) : null}

              {order.payment_status !== 'paid' ? (
                <button
                  className="btn-secondary"
                  disabled={loadingId === order.id + 'paid'}
                  onClick={() => changePayment(order.id, 'paid')}
                >
                  {loadingId === order.id + 'paid' ? 'Confirmando...' : 'Confirmar pagamento'}
                </button>
              ) : null}

              {order.payment_status !== 'failed' && order.payment_status !== 'refunded' ? (
                <button
                  className="btn-secondary"
                  disabled={loadingId === order.id + 'failed'}
                  onClick={() => changePayment(order.id, 'failed')}
                >
                  Marcar falha no pagamento
                </button>
              ) : null}

              {order.status !== 'cancelled' && order.status !== 'completed' ? (
                <button
                  className="btn-secondary"
                  disabled={loadingId === order.id + 'cancelled'}
                  onClick={() => changeStatus(order.id, 'cancelled')}
                >
                  Cancelar pedido
                </button>
              ) : null}

              <Link href={`/dashboard/operations/print/${order.id}`} className="btn-secondary text-center">
                Imprimir cozinha
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
