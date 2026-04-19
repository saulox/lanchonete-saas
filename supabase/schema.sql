create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'operator', 'kitchen', 'customer');
create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type public.payment_method as enum ('pix', 'cash', 'card');
create type public.payment_status as enum ('pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded');

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  email text unique,
  full_name text,
  role public.user_role not null default 'customer',
  accepts_promotions boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (store_id, profile_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  description text,
  code text,
  discount_percent numeric(5,2) not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (store_id, code)
);

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  phone text not null,
  full_name text,
  accepts_promotions boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, phone)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  phone text not null,
  customer_name text not null,
  status public.order_status not null default 'pending',
  subtotal_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  coupon_code text,
  payment_method public.payment_method not null default 'pix',
  payment_status public.payment_status not null default 'pending',
  payment_reference text,
  payment_provider text,
  paid_at timestamptz,
  pix_copy_paste text,
  pix_qr_code_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, full_name, role, accepts_promotions)
  values (
    new.id,
    nullif(new.phone, ''),
    coalesce(new.email, new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer'),
    coalesce((new.raw_user_meta_data ->> 'accepts_promotions')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.store_memberships enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.marketing_leads enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.current_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff_for_store(target_store_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.store_memberships sm
    where sm.store_id = target_store_id
      and sm.profile_id = auth.uid()
      and sm.role in ('admin', 'operator', 'kitchen')
  )
  or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
$$;

create policy "Anyone can read active stores" on public.stores
for select using (is_active = true or public.current_role() = 'admin');

create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id or public.current_role() in ('admin','operator','kitchen'));

create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id or public.current_role() = 'admin');

create policy "Staff can read memberships" on public.store_memberships
for select using (public.current_role() in ('admin', 'operator'));

create policy "Anyone can read active products" on public.products
for select using (is_active = true or public.is_staff_for_store(store_id));
create policy "Staff manage products" on public.products
for all using (public.is_staff_for_store(store_id)) with check (public.is_staff_for_store(store_id));

create policy "Anyone can read promotions" on public.promotions
for select using (active = true or public.is_staff_for_store(store_id));
create policy "Store admins manage promotions" on public.promotions
for all using (public.is_staff_for_store(store_id)) with check (public.is_staff_for_store(store_id));

create policy "Staff read leads" on public.marketing_leads
for select using (public.is_staff_for_store(store_id));
create policy "Public upsert leads" on public.marketing_leads
for insert with check (true);
create policy "Staff update leads" on public.marketing_leads
for update using (public.is_staff_for_store(store_id));

create policy "Staff read all orders for store or customer own orders" on public.orders
for select using (
  public.is_staff_for_store(store_id)
  or customer_id = auth.uid()
);
create policy "Customers create orders" on public.orders
for insert with check (true);
create policy "Staff update orders" on public.orders
for update using (public.is_staff_for_store(store_id));

create policy "Read order items by order access" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (public.is_staff_for_store(o.store_id) or o.customer_id = auth.uid())
  )
);
create policy "Insert order items" on public.order_items
for insert with check (true);
create policy "Staff update order items" on public.order_items
for update using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and public.is_staff_for_store(o.store_id)
  )
);

alter publication supabase_realtime add table public.orders;

insert into public.stores (name, slug, phone)
values ('Loja Matriz', 'matriz', '(98) 99999-0000')
on conflict (slug) do nothing;

insert into public.products (store_id, name, description, price)
select s.id, p.name, p.description, p.price
from public.stores s
cross join (
  values
    ('X-Burguer', 'Pão, carne, queijo e salada', 18.90::numeric),
    ('X-Tudo', 'Lanche completo da casa', 24.90::numeric),
    ('Batata Frita', 'Porção média', 15.00::numeric),
    ('Refrigerante 350ml', 'Lata', 6.50::numeric)
) as p(name, description, price)
where s.slug = 'matriz'
on conflict do nothing;

insert into public.promotions (store_id, title, description, code, discount_percent, active)
select s.id, promo.title, promo.description, promo.code, promo.discount_percent, true
from public.stores s
cross join (
  values
    ('Combo Almoço', 'Desconto automático das 11h às 14h', 'ALMOCO10', 10::numeric),
    ('Primeiro Pedido', 'Incentivo para novos clientes cadastrados', 'BEMVINDO15', 15::numeric),
    ('PIX da Casa', 'Desconto especial no pagamento via PIX', 'PIX5', 5::numeric)
) as promo(title, description, code, discount_percent)
where s.slug = 'matriz'
on conflict (store_id, code) do nothing;
