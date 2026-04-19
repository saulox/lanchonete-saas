import { MobileNav } from '@/components/mobile-nav';
import { MobileShop } from '@/components/mobile-shop';
import { createClient } from '@/lib/supabase/server';
import { getCurrentStore } from '@/lib/store';

export default async function MobilePage() {
  const supabase = await createClient();
  const store = await getCurrentStore();

  if (!store) {
    return <main className="p-6">Nenhuma loja cadastrada.</main>;
  }

  const [{ data: products }, { data: promotions }, { data: orders }] = await Promise.all([
    supabase.from('products').select('id, store_id, name, description, price, is_active').eq('store_id', store.id).eq('is_active', true).limit(20),
    supabase.from('promotions').select('id, title, description, code, discount_percent, active').eq('store_id', store.id).eq('active', true).limit(5),
    supabase
      .from('orders')
      .select('id, customer_name, status, total_amount, payment_method, payment_status, payment_reference, coupon_code, created_at')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:px-6 md:py-8">
      <div className="mx-auto max-w-4xl space-y-5 p-4">
        <MobileShop
          products={(products as any[]) ?? []}
          promotions={(promotions as any[]) ?? []}
          initialOrders={(orders as any[]) ?? []}
          storeId={store.id}
        />
      </div>
      <MobileNav />
    </main>
  );
}
