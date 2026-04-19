import { createClient } from '@/lib/supabase/server';

export async function PromotionList() {
  const supabase = await createClient();
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .order('active', { ascending: false })
    .order('starts_at', { ascending: false });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(promotions ?? []).map((promo) => (
        <article key={promo.id} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{promo.title}</h3>
              <p className="text-sm text-slate-500">{promo.description}</p>
            </div>
            <span className={`badge ${promo.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {promo.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-medium text-orange-600">{promo.discount_percent}% OFF</span>
            <span className="text-slate-500">Cupom: {promo.code ?? 'automático'}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
