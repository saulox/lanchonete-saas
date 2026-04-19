import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { currency, paymentMethodLabel, paymentStatusLabel } from '@/lib/utils';
import { PrintButton } from '@/components/print-button';

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_name, phone, notes, subtotal_amount, discount_amount, total_amount, coupon_code, payment_method, payment_status, payment_reference, paid_at, pix_copy_paste, pix_qr_code_url, created_at, stores(name), order_items(product_name, quantity, unit_price)')
    .eq('id', id)
    .single();

  if (!order) notFound();

  return (
    <main className="mx-auto max-w-[420px] bg-white p-4 text-slate-900 print:max-w-[80mm] print:p-1 print:text-[12px]">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-black">Impressão de cozinha</h1>
        <PrintButton />
      </div>

      <div className="border-b-2 border-dashed border-slate-300 pb-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em]">Pedido cozinha</p>
        <h2 className="mt-2 text-2xl font-black">#{order.id.slice(0, 8)}</h2>
        <p className="mt-1 text-sm">{(order as any).stores?.name ?? 'Loja'}</p>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <p><strong>Cliente:</strong> {order.customer_name}</p>
        <p><strong>Telefone:</strong> {order.phone}</p>
        <p><strong>Hora:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}</p>
        <p><strong>Pagamento:</strong> {paymentMethodLabel(order.payment_method as any)}</p>
        <p><strong>Status pgto:</strong> {paymentStatusLabel(order.payment_status as any)}</p>
        {order.payment_reference ? <p><strong>Ref.:</strong> {order.payment_reference}</p> : null}
        {order.paid_at ? <p><strong>Pago em:</strong> {new Date(order.paid_at).toLocaleString('pt-BR')}</p> : null}
        {order.coupon_code ? <p><strong>Cupom:</strong> {order.coupon_code}</p> : null}
        {order.notes ? <p><strong>Obs:</strong> {order.notes}</p> : null}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Itens</h3>
        <div className="mt-2 space-y-2">
          {((order as any).order_items ?? []).map((item: any) => (
            <div key={`${item.product_name}-${item.quantity}`} className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-2 text-sm">
              <div>
                <p className="font-bold">{item.quantity}x {item.product_name}</p>
                <p className="text-slate-500">{currency(Number(item.unit_price))}</p>
              </div>
              <strong>{currency(Number(item.quantity) * Number(item.unit_price))}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t-2 border-dashed border-slate-300 pt-3 text-sm">
        <div className="flex items-center justify-between"><span>Subtotal</span><strong>{currency(Number(order.subtotal_amount ?? order.total_amount))}</strong></div>
        <div className="mt-1 flex items-center justify-between"><span>Desconto</span><strong>- {currency(Number(order.discount_amount ?? 0))}</strong></div>
        <div className="mt-1 flex items-center justify-between text-base"><span>Total</span><strong>{currency(Number(order.total_amount))}</strong></div>
      </div>

      {order.payment_method === 'pix' ? (
        <div className="mt-4 border-t border-slate-200 pt-3 text-[11px]">
          <p className="font-bold uppercase">PIX</p>
          {order.pix_qr_code_url ? <p className="mt-1">QR Code: {order.pix_qr_code_url}</p> : null}
          {order.pix_copy_paste ? <p className="mt-1 break-all">Copia e cola: {order.pix_copy_paste}</p> : <p className="mt-1">Configure a chave PIX no .env para gerar o código.</p>}
        </div>
      ) : null}
    </main>
  );
}
