import { createClient } from '@/lib/supabase/server';
import { currency, paymentMethodLabel, paymentStatusLabel } from '@/lib/utils';
import { getCurrentStore } from '@/lib/store';

export default async function FinancePage() {
  const supabase = await createClient();
  const store = await getCurrentStore();

  let query = supabase
    .from('orders')
    .select('id, customer_name, total_amount, payment_method, payment_status, coupon_code, created_at, paid_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (store) {
    query = query.eq('store_id', store.id);
  }

  const { data: orders } = await query;
  const rows = orders ?? [];

  const metrics = {
    gross: rows.reduce((acc, row) => acc + Number(row.total_amount), 0),
    paid: rows.filter((row) => row.payment_status === 'paid').reduce((acc, row) => acc + Number(row.total_amount), 0),
    pending: rows.filter((row) => row.payment_status !== 'paid').reduce((acc, row) => acc + Number(row.total_amount), 0),
    pix: rows.filter((row) => row.payment_method === 'pix').reduce((acc, row) => acc + Number(row.total_amount), 0)
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Financeiro por loja</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Recebimentos e pagamentos</h1>
        <p className="mt-2 text-sm text-slate-500">Acompanhe total bruto, valores pagos e pedidos aguardando confirmação.</p>
        {store ? <p className="mt-1 text-sm text-slate-400">Loja ativa: {store.name}</p> : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="card p-5"><p className="text-sm text-slate-500">Volume total</p><h2 className="mt-2 text-3xl font-black">{currency(metrics.gross)}</h2></article>
        <article className="card p-5"><p className="text-sm text-slate-500">Recebido</p><h2 className="mt-2 text-3xl font-black text-emerald-600">{currency(metrics.paid)}</h2></article>
        <article className="card p-5"><p className="text-sm text-slate-500">A receber</p><h2 className="mt-2 text-3xl font-black text-amber-600">{currency(metrics.pending)}</h2></article>
        <article className="card p-5"><p className="text-sm text-slate-500">Pedidos PIX</p><h2 className="mt-2 text-3xl font-black">{currency(metrics.pix)}</h2></article>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-900">Últimos recebimentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Cupom</th>
                <th className="px-4 py-3">Criado</th>
                <th className="px-4 py-3">Pago em</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-3 font-semibold">#{row.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{row.customer_name}</td>
                  <td className="px-4 py-3">{paymentMethodLabel(row.payment_method)}</td>
                  <td className="px-4 py-3">{paymentStatusLabel(row.payment_status)}</td>
                  <td className="px-4 py-3">{row.coupon_code ?? '-'}</td>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">{row.paid_at ? new Date(row.paid_at).toLocaleString('pt-BR') : '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{currency(Number(row.total_amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
