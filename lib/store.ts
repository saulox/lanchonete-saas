import { createClient } from '@/lib/supabase/server';

export async function getCurrentStore() {
  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_DEFAULT_STORE_SLUG ?? 'matriz';

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (store) return store;

  const { data: fallback } = await supabase
    .from('stores')
    .select('id, name, slug')
    .limit(1)
    .single();

  return fallback;
}
