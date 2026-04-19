import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { currency } from '@/lib/utils';
import { getCurrentStore } from '@/lib/store';

export default async function DashboardPage() {
  const supabase = await createClient();
  const store = await getCurrentStore();

  let ordersQuery = supabase.from('orders').select('total_amount, payment_status', { count: 'exact' });
  let promosQuery = supabase.from('promotions').select('*', { count: 'exact', head: true });

  if (store) {
    ordersQuery = ordersQuery.eq('store_id', store.id);
    promosQuery = promosQuery.eq('store_id', store.id);
  }

  const [{ count: usersCount }, { count: promosCount }, { data: revenueRows, count: ordersCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    promosQuery,
    ordersQuery.limit(100)
  ]);

  const grossRevenue = (revenueRows ?? []).reduce((acc, row) => acc + Number(row.total_amount), 0);
  const paidRevenue = (revenueRows ?? []).filter((row) => row.payment_status === 'paid').reduce((acc, row) => acc + Number(row.total_amount), 0);

  const cards = [
    { label: 'Pedidos', value: String(ordersCount ?? 0) },
    { label: 'Usuários', value: String(usersCount ?? 0) },
    { label: 'Promoções', value: String(promosCount ?? 0) },
    { label: 'Recebido', value: currency(paidRevenue || grossRevenue) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Painel desktop</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Visão geral da operação</h1>
          {store ? <p className="mt-2 text-sm text-slate-500">Loja ativa: {store.name}</p> : null}
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/operations" className="btn-primary">Abrir fila</Link>
          <Link href="/dashboard/finance" className="btn-secondary">Financeiro</Link>
          <Link href="/m" className="btn-secondary">Ver mobile</Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="card p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-xl font-bold">Módulos entregues na V5</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>• Auth por e-mail com senha/OTP</li>
            <li>• Fila de pedidos em tempo real</li>
            <li>• Promoções e cupons</li>
            <li>• Perfis de acesso</li>
            <li>• Mobile responsivo para cliente e equipe</li>
            <li>• Financeiro por loja</li>
            <li>• Webhook de confirmação de pagamento</li>
          </ul>
        </article>
        <article className="card p-6">
          <h2 className="text-xl font-bold">Próximos passos</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>1. Rodar o SQL em <code>supabase/schema.sql</code></li>
            <li>2. Configurar env local e segredo do webhook</li>
            <li>3. Configurar Auth por e-mail no Supabase</li>
            <li>4. Publicar no Git e Vercel</li>
          </ol>
        </article>
      </section>
    </div>
  );
}
