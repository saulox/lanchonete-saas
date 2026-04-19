'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { currency, paymentMethodLabel, paymentStatusLabel } from '@/lib/utils';
import type { PaymentMethod } from '@/types/database';

type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  discount_percent: number;
  active: boolean;
};

type Order = {
  id: string;
  customer_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status?: 'pending' | 'awaiting_confirmation' | 'paid' | 'failed' | 'refunded';
  payment_reference?: string | null;
  coupon_code: string | null;
  created_at: string;
};

type CartItem = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
};

const statusLabel = {
  pending: 'Novo',
  preparing: 'Em preparo',
  ready: 'Pronto',
  completed: 'Finalizado',
  cancelled: 'Cancelado'
};

const paymentOptions: PaymentMethod[] = ['pix', 'cash', 'card'];

export function MobileShop({
  products,
  promotions,
  initialOrders,
  storeId
}: {
  products: Product[];
  promotions: Promotion[];
  initialOrders: Order[];
  storeId: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [selectedPromotionCode, setSelectedPromotionCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [acceptsPromotions, setAcceptsPromotions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pixInfo, setPixInfo] = useState<{ copyPaste?: string | null; qrCodeUrl?: string | null } | null>(null);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const saved = localStorage.getItem(`lanchonete-cart:${storeId}`);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {}
    }
  }, [storeId]);

  useEffect(() => {
    localStorage.setItem(`lanchonete-cart:${storeId}`, JSON.stringify(cart));
  }, [cart, storeId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`mobile-orders-${storeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, async () => {
        const { data } = await supabase
          .from('orders')
          .select('id, customer_name, status, total_amount, payment_method, payment_status, payment_reference, coupon_code, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) setOrders(data as Order[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0), [cart]);

  const selectedPromotion = useMemo(() => {
    const code = (selectedPromotionCode || couponCode).trim().toUpperCase();
    return promotions.find((promo) => promo.code?.toUpperCase() === code) ?? null;
  }, [couponCode, promotions, selectedPromotionCode]);

  const discountAmount = useMemo(() => {
    if (!selectedPromotion) return 0;
    return Number(((subtotal * Number(selectedPromotion.discount_percent)) / 100).toFixed(2));
  }, [selectedPromotion, subtotal]);

  const total = useMemo(() => Math.max(subtotal - discountAmount, 0), [discountAmount, subtotal]);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) => (item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: Number(product.price),
          quantity: 1
        }
      ];
    });
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.product_id !== productId));
      return;
    }

    setCart((current) => current.map((item) => (item.product_id === productId ? { ...item, quantity: nextQuantity } : item)));
  }

  async function handleSubmit() {
    if (!customerName || !phone || cart.length === 0) {
      setMessage('Preencha nome, telefone e adicione itens ao carrinho.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setPixInfo(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          customer_name: customerName,
          phone,
          notes,
          accepts_promotions: acceptsPromotions,
          payment_method: paymentMethod,
          coupon_code: (selectedPromotionCode || couponCode).trim().toUpperCase() || undefined,
          items: cart
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? 'Erro ao criar pedido.');
        return;
      }

      setMessage(`Pedido enviado com sucesso. Nº ${String(payload.data.id).slice(0, 8)}`);
      setPixInfo({ copyPaste: payload.data.pix_copy_paste, qrCodeUrl: payload.data.pix_qr_code_url });
      setCart([]);
      setNotes('');
      setCouponCode('');
      setSelectedPromotionCode('');
    } catch {
      setMessage('Falha de comunicação com a API.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">Cliente / Equipe</p>
        <h1 className="mt-2 text-3xl font-black">Pedidos da lanchonete</h1>
        <p className="mt-2 text-sm text-orange-50">Carrinho, cupom, pagamento, PIX e acompanhamento ao vivo.</p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Promoções ativas</h2>
          <span className="text-xs text-slate-500">Cupom no carrinho</span>
        </div>
        <div className="grid gap-3">
          {promotions.map((promo) => (
            <article key={promo.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{promo.title}</h3>
                  <p className="text-sm text-slate-500">{promo.description}</p>
                  {promo.code ? <p className="mt-2 text-xs font-semibold text-orange-600">Cupom: {promo.code}</p> : null}
                </div>
                <div className="text-right">
                  <span className="badge bg-orange-100 text-orange-700">{promo.discount_percent}% OFF</span>
                  {promo.code ? (
                    <button
                      className="mt-2 block text-xs font-semibold text-orange-600"
                      onClick={() => {
                        setCouponCode(promo.code ?? '');
                        setSelectedPromotionCode(promo.code ?? '');
                      }}
                    >
                      Aplicar cupom
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Cardápio</h2>
          <span className="text-xs text-slate-500">{products.length} itens</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((product) => (
            <article key={product.id} className="card p-4">
              <h3 className="font-bold text-slate-900">{product.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <strong className="text-orange-600">{currency(Number(product.price))}</strong>
                <button className="btn-primary" onClick={() => addToCart(product)}>Adicionar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Carrinho</h2>
          <strong className="text-orange-600">{currency(total)}</strong>
        </div>

        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Seu carrinho está vazio.</p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.product_name}</h3>
                    <p className="text-sm text-slate-500">{currency(item.unit_price)} cada</p>
                  </div>
                  <strong>{currency(item.unit_price * item.quantity)}</strong>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="btn-secondary px-3 py-2" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                  <span className="min-w-10 text-center font-semibold">{item.quantity}</span>
                  <button className="btn-secondary px-3 py-2" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <input className="input" placeholder="Seu nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="input" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input
            className="input"
            placeholder="Cupom promocional"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setSelectedPromotionCode('');
            }}
          />
          <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-700">Forma de pagamento</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {paymentOptions.map((option) => (
                <button
                  key={option}
                  className={option === paymentMethod ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setPaymentMethod(option)}
                  type="button"
                >
                  {paymentMethodLabel(option)}
                </button>
              ))}
            </div>
          </div>
          <textarea className="input min-h-24" placeholder="Observações do pedido" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={acceptsPromotions} onChange={(e) => setAcceptsPromotions(e.target.checked)} />
            Aceito receber promoções da loja
          </label>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <strong>{currency(subtotal)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Desconto</span>
              <strong className="text-emerald-600">- {currency(discountAmount)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between text-base text-slate-900">
              <span>Total</span>
              <strong>{currency(total)}</strong>
            </div>
            {selectedPromotion ? <p className="mt-2 text-xs text-orange-600">Cupom aplicado: {selectedPromotion.code}</p> : null}
          </div>

          <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Enviando pedido...' : 'Fechar pedido'}
          </button>
          {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
          {paymentMethod === 'pix' && pixInfo?.copyPaste ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">PIX gerado para o pedido</p>
              <p className="mt-2 break-all text-xs">{pixInfo.copyPaste}</p>
              {pixInfo.qrCodeUrl ? <p className="mt-2 text-xs">QR Code configurado em: {pixInfo.qrCodeUrl}</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Últimos pedidos</h2>
          <span className="text-xs text-slate-500">Tempo real</span>
        </div>
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Pedido #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-500">{order.customer_name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge bg-slate-100 text-slate-700">{statusLabel[order.status]}</span>
                  <p className="mt-2 text-sm font-semibold text-orange-600">{currency(Number(order.total_amount))}</p>
                  <p className="mt-1 text-xs text-slate-500">{paymentMethodLabel(order.payment_method)}</p>
                  {order.payment_status ? <p className="mt-1 text-xs text-slate-400">Pagamento: {paymentStatusLabel(order.payment_status)}{order.payment_reference ? ` • ${order.payment_reference}` : ''}</p> : null}
                  {order.coupon_code ? <p className="mt-1 text-xs text-emerald-600">Cupom {order.coupon_code}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
