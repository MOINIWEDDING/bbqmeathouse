-- =========================================================
-- BBQ Meathouse — configuración completa de Supabase
-- Corre esto UNA sola vez en un proyecto nuevo: Supabase → SQL Editor → New query
-- → pega todo este archivo → Run.
--
-- Es seguro volver a correrlo si algo falla a mitad de camino: casi todo usa
-- "if not exists" / "on conflict do nothing", y las políticas de seguridad se
-- borran y se vuelven a crear (drop policy if exists) para que nunca truene
-- por "ya existe".
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1) PERFILES (rol cliente / comensal / dueño)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'cliente' check (role in ('cliente','staff','comensal')),
  gender text,
  age int,
  avatar_url text,
  avatar_icon text,
  avatar_tint text,
  gift_card_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_icon text;
alter table public.profiles add column if not exists avatar_tint text;
alter table public.profiles add column if not exists gift_card_balance numeric not null default 0;

alter table public.profiles enable row level security;

-- ---------- funciones auxiliares (evitan RLS recursivo y se reutilizan abajo) ----------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'staff'
  );
$$;

create or replace function public.is_order_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('staff','comensal')
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Staff can view all profiles" on public.profiles;
create policy "Staff can view all profiles"
  on public.profiles for select
  using (public.is_staff());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- crea el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, gender, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente'),
    nullif(new.raw_user_meta_data->>'gender', ''),
    nullif(new.raw_user_meta_data->>'age', '')::int
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 2) CATEGORÍAS (dinámicas, las administra el dueño)
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default 'smoker',
  tint text not null default 'manana',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

drop policy if exists "Staff can insert categories" on public.categories;
create policy "Staff can insert categories"
  on public.categories for insert
  with check (public.is_staff());

drop policy if exists "Staff can update categories" on public.categories;
create policy "Staff can update categories"
  on public.categories for update
  using (public.is_staff());

drop policy if exists "Staff can delete categories" on public.categories;
create policy "Staff can delete categories"
  on public.categories for delete
  using (public.is_staff());

insert into public.categories (name, icon, tint, sort_order) values
  ('Ahumados','flame','manana',1),
  ('Parrilla','meat','tarde',2),
  ('Guarniciones','side','salado',3),
  ('Bebidas','drink','experiencia',4)
on conflict do nothing;

-- =========================================================
-- 3) MENÚ
-- =========================================================
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Ahumados',
  icon text not null default 'smoker',
  price numeric not null default 0,
  cost numeric not null default 0,
  description text default '',
  image_url text default '',
  tags text default '',
  featured boolean not null default false,
  is_beverage boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items add column if not exists icon text not null default 'smoker';
alter table public.menu_items add column if not exists cost numeric not null default 0;
alter table public.menu_items add column if not exists tags text default '';
alter table public.menu_items add column if not exists featured boolean not null default false;
alter table public.menu_items add column if not exists is_beverage boolean not null default false;
alter table public.menu_items add column if not exists options jsonb not null default '[]'::jsonb;

alter table public.menu_items enable row level security;

drop policy if exists "Anyone can view menu" on public.menu_items;
create policy "Anyone can view menu"
  on public.menu_items for select
  using (true);

drop policy if exists "Staff can insert menu items" on public.menu_items;
create policy "Staff can insert menu items"
  on public.menu_items for insert
  with check (public.is_staff());

drop policy if exists "Staff can update menu items" on public.menu_items;
create policy "Staff can update menu items"
  on public.menu_items for update
  using (public.is_staff());

drop policy if exists "Staff can delete menu items" on public.menu_items;
create policy "Staff can delete menu items"
  on public.menu_items for delete
  using (public.is_staff());

-- ---------- menú de ejemplo (bórralo o edítalo desde la página cuando tengas el tuyo) ----------
insert into public.menu_items (name, category, icon, price, cost, description, tags, featured, is_beverage, image_url) values
  ('Brisket ahumado 14 horas','Ahumados','flame',480,220,'Pecho de res ahumado low & slow, corteza oscura y anillo de humo.','Ahumado,Res,Especialidad',true,false,'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=800&auto=format&fit=crop'),
  ('Costillas de cerdo BBQ','Ahumados','ribs',420,190,'Costillar completo, glaseado con salsa BBQ de la casa.','Ahumado,Cerdo',false,false,'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop'),
  ('Pollo a la parrilla','Parrilla','meat',320,140,'Medio pollo marinado, a la parrilla con carbón.','Parrilla,Pollo',false,false,'https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=800&auto=format&fit=crop'),
  ('Hamburguesa Meathouse','Parrilla','meat',350,160,'Carne molida de la casa, queso ahumado y tocineta.','Res,Parrilla',true,false,'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=800&auto=format&fit=crop'),
  ('Mac and cheese ahumado','Guarniciones','side',220,90,'Pasta cremosa con tres quesos y un toque de ahumado.','Guarnición,Vegetariano',false,false,'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop'),
  ('Papas con especias de la casa','Guarniciones','side',180,70,'Papas fritas con la mezcla de especias secreta de la casa.','Guarnición',false,false,'https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=800&auto=format&fit=crop'),
  ('Limonada de la casa','Bebidas','drink',150,50,'Limonada natural, receta de la casa.','Refrescante,Sin alcohol',false,true,'https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=800&auto=format&fit=crop'),
  ('Cerveza artesanal','Bebidas','drink',220,100,'Selección rotativa de cervecerías dominicanas.','Artesanal,Fría',false,true,'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop')
on conflict do nothing;

-- =========================================================
-- 4) FOTOS DEL SITIO (portada, fundador, terraza, galería, mapa, bienvenida)
-- =========================================================
create table if not exists public.site_images (
  key text primary key,
  url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_images enable row level security;

drop policy if exists "Anyone can view site images" on public.site_images;
create policy "Anyone can view site images"
  on public.site_images for select
  using (true);

drop policy if exists "Staff can update site images" on public.site_images;
create policy "Staff can update site images"
  on public.site_images for update
  using (public.is_staff());

-- filas base (la página hace UPDATE, no INSERT, así que deben existir de antemano).
-- Vienen precargadas con fotos de stock (Unsplash, licencia libre) para que el
-- sitio se vea completo desde el día uno. Reemplázalas cuando tengas fotos reales.
insert into public.site_images (key, url) values
  ('hero','https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=1000&auto=format&fit=crop'),
  ('founder','https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=1000&auto=format&fit=crop'),
  ('azotea','https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'),
  ('gallery-0','https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=900&auto=format&fit=crop'),
  ('gallery-1','https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=900&auto=format&fit=crop'),
  ('gallery-2','https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop'),
  ('welcome','https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=1200&auto=format&fit=crop'),
  ('map','')
on conflict (key) do nothing;

-- =========================================================
-- 5) TEXTOS EDITABLES DEL SITIO (EditableText en Nosotros, etc.)
-- =========================================================
create table if not exists public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Anyone can view site content" on public.site_content;
create policy "Anyone can view site content"
  on public.site_content for select
  using (true);

drop policy if exists "Staff can upsert site content" on public.site_content;
create policy "Staff can upsert site content"
  on public.site_content for insert
  with check (public.is_staff());

drop policy if exists "Staff can update site content" on public.site_content;
create policy "Staff can update site content"
  on public.site_content for update
  using (public.is_staff());

-- =========================================================
-- 6) PÁGINA "NOSOTROS": pilares, cultura y galería
-- =========================================================
create table if not exists public.nosotros_pilares (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.nosotros_pilares enable row level security;

drop policy if exists "Anyone can view pilares" on public.nosotros_pilares;
create policy "Anyone can view pilares" on public.nosotros_pilares for select using (true);
drop policy if exists "Staff can insert pilares" on public.nosotros_pilares;
create policy "Staff can insert pilares" on public.nosotros_pilares for insert with check (public.is_staff());
drop policy if exists "Staff can update pilares" on public.nosotros_pilares;
create policy "Staff can update pilares" on public.nosotros_pilares for update using (public.is_staff());
drop policy if exists "Staff can delete pilares" on public.nosotros_pilares;
create policy "Staff can delete pilares" on public.nosotros_pilares for delete using (public.is_staff());

insert into public.nosotros_pilares (title, body, sort_order) values
  ('Ahumado low & slow','Cortes seleccionados, madera de la buena y hasta 14 horas de ahumado. Sin atajos, sin microondas, sin prisa.',1),
  ('Ambiente de asador','Diseño industrial con toques acogedores, mesas largas para compartir y música de fondo pensada para quedarse un rato más.',2)
on conflict do nothing;

create table if not exists public.nosotros_cultura (
  id uuid primary key default gen_random_uuid(),
  tag text not null default '',
  title text not null default '',
  body text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.nosotros_cultura enable row level security;

drop policy if exists "Anyone can view cultura" on public.nosotros_cultura;
create policy "Anyone can view cultura" on public.nosotros_cultura for select using (true);
drop policy if exists "Staff can insert cultura" on public.nosotros_cultura;
create policy "Staff can insert cultura" on public.nosotros_cultura for insert with check (public.is_staff());
drop policy if exists "Staff can update cultura" on public.nosotros_cultura;
create policy "Staff can update cultura" on public.nosotros_cultura for update using (public.is_staff());
drop policy if exists "Staff can delete cultura" on public.nosotros_cultura;
create policy "Staff can delete cultura" on public.nosotros_cultura for delete using (public.is_staff());

insert into public.nosotros_cultura (tag, title, body, sort_order) values
  ('Sede de eventos','Noches de asado y música en vivo','Prestamos el espacio y la parrilla para encuentros, cumpleaños y celebraciones de empresa.',1),
  ('Catas','Maridaje de carnes y cerveza artesanal','Anfitriones de catas guiadas, explorando cortes, técnicas de ahumado y el mejor acompañante en vaso.',2),
  ('Experimental','Salsas y aderezos de autor','Recetas propias de la casa, pensadas para acompañar cada corte con una vuelta de sabor distinta.',3)
on conflict do nothing;

create table if not exists public.nosotros_gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.nosotros_gallery enable row level security;

drop policy if exists "Anyone can view nosotros gallery" on public.nosotros_gallery;
create policy "Anyone can view nosotros gallery" on public.nosotros_gallery for select using (true);
drop policy if exists "Staff can insert nosotros gallery" on public.nosotros_gallery;
create policy "Staff can insert nosotros gallery" on public.nosotros_gallery for insert with check (public.is_staff());
drop policy if exists "Staff can update nosotros gallery" on public.nosotros_gallery;
create policy "Staff can update nosotros gallery" on public.nosotros_gallery for update using (public.is_staff());
drop policy if exists "Staff can delete nosotros gallery" on public.nosotros_gallery;
create policy "Staff can delete nosotros gallery" on public.nosotros_gallery for delete using (public.is_staff());

insert into public.nosotros_gallery (image_url, sort_order) values
  ('https://images.unsplash.com/photo-1558030089-02acba3c214e?q=80&w=900&auto=format&fit=crop',1),
  ('https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=900&auto=format&fit=crop',2),
  ('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop',3)
on conflict do nothing;

-- =========================================================
-- 7) BANNERS DE OFERTA (carrusel de Inicio)
-- =========================================================
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image_url text default '',
  cta_text text default 'Ver menú',
  cta_link text default '/menu',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.offers enable row level security;

drop policy if exists "Anyone can view offers" on public.offers;
create policy "Anyone can view offers" on public.offers for select using (true);
drop policy if exists "Staff can insert offers" on public.offers;
create policy "Staff can insert offers" on public.offers for insert with check (public.is_staff());
drop policy if exists "Staff can update offers" on public.offers;
create policy "Staff can update offers" on public.offers for update using (public.is_staff());
drop policy if exists "Staff can delete offers" on public.offers;
create policy "Staff can delete offers" on public.offers for delete using (public.is_staff());

insert into public.offers (title, subtitle, image_url, cta_text, cta_link, sort_order) values
  ('Costillas ahumadas todo el fin de semana','Sábado y domingo, mientras haya en la parrilla.','https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop','Ver menú','/menu',1),
  ('Brisket 14 horas, recién salido del ahumador','Cantidad limitada cada día.','https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=1200&auto=format&fit=crop','Ver menú','/menu',2)
on conflict do nothing;

-- =========================================================
-- 8) MESAS (por sucursal)
-- =========================================================
create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.dining_tables enable row level security;

drop policy if exists "Anyone can view tables" on public.dining_tables;
create policy "Anyone can view tables" on public.dining_tables for select using (true);
drop policy if exists "Staff can insert tables" on public.dining_tables;
create policy "Staff can insert tables" on public.dining_tables for insert with check (public.is_staff());
drop policy if exists "Staff can update tables" on public.dining_tables;
create policy "Staff can update tables" on public.dining_tables for update using (public.is_staff());
drop policy if exists "Staff can delete tables" on public.dining_tables;
create policy "Staff can delete tables" on public.dining_tables for delete using (public.is_staff());

-- =========================================================
-- 9) EARLY BIRD (bebida gratis al primero del día, por sucursal)
-- =========================================================
create table if not exists public.early_bird_settings (
  branch text primary key,
  enabled boolean not null default false,
  start_time time not null default '07:00',
  end_time time not null default '09:00',
  prize_description text not null default 'Una bebida gratis',
  prize_item_id uuid references public.menu_items(id) on delete set null,
  discount_any_beverage boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.early_bird_settings enable row level security;

drop policy if exists "Anyone can view early bird settings" on public.early_bird_settings;
create policy "Anyone can view early bird settings" on public.early_bird_settings for select using (true);
drop policy if exists "Staff can insert early bird settings" on public.early_bird_settings;
create policy "Staff can insert early bird settings" on public.early_bird_settings for insert with check (public.is_staff());
drop policy if exists "Staff can update early bird settings" on public.early_bird_settings;
create policy "Staff can update early bird settings" on public.early_bird_settings for update using (public.is_staff());

create table if not exists public.early_bird_wins (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  win_date date not null default current_date,
  customer_name text,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid,
  created_at timestamptz not null default now(),
  unique (branch, win_date)
);
alter table public.early_bird_wins enable row level security;

drop policy if exists "Staff can view early bird wins" on public.early_bird_wins;
create policy "Staff can view early bird wins" on public.early_bird_wins for select using (public.is_staff());

-- =========================================================
-- 10) IMPUESTOS Y PORCIENTOS (por sucursal)
-- =========================================================
create table if not exists public.tax_settings (
  branch text primary key,
  charges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.tax_settings enable row level security;

drop policy if exists "Anyone can view tax settings" on public.tax_settings;
create policy "Anyone can view tax settings" on public.tax_settings for select using (true);
drop policy if exists "Staff can insert tax settings" on public.tax_settings;
create policy "Staff can insert tax settings" on public.tax_settings for insert with check (public.is_staff());
drop policy if exists "Staff can update tax settings" on public.tax_settings;
create policy "Staff can update tax settings" on public.tax_settings for update using (public.is_staff());

-- =========================================================
-- 11) DISEÑOS Y GIFT CARDS
-- =========================================================
create table if not exists public.gift_card_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  image_url text not null,
  scope text not null default 'global',
  owner_user_id uuid references auth.users(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gift_card_designs enable row level security;

drop policy if exists "Anyone can view gift card designs" on public.gift_card_designs;
create policy "Anyone can view gift card designs" on public.gift_card_designs for select using (true);
drop policy if exists "Staff can insert gift card designs" on public.gift_card_designs;
create policy "Staff can insert gift card designs" on public.gift_card_designs for insert with check (public.is_staff());
drop policy if exists "Staff can update gift card designs" on public.gift_card_designs;
create policy "Staff can update gift card designs" on public.gift_card_designs for update using (public.is_staff());
drop policy if exists "Staff can delete gift card designs" on public.gift_card_designs;
create policy "Staff can delete gift card designs" on public.gift_card_designs for delete using (public.is_staff());

insert into public.gift_card_designs (name, image_url, scope, sort_order) values
  ('Ahumado clásico','https://images.unsplash.com/photo-1548899278-41c14dcddc69?q=80&w=1200&auto=format&fit=crop','global',1),
  ('Noche de parrilla','https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop','global',2)
on conflict do nothing;

create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount numeric not null,
  status text not null default 'activa' check (status in ('activa','canjeada')),
  is_gift boolean not null default false,
  buyer_user_id uuid references auth.users(id) on delete set null,
  buyer_name text,
  recipient_email text,
  design_id uuid references public.gift_card_designs(id) on delete set null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_by_name text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;

drop policy if exists "Users can view own gift cards" on public.gift_cards;
create policy "Users can view own gift cards"
  on public.gift_cards for select
  using (
    buyer_user_id = auth.uid()
    or redeemed_by = auth.uid()
    or recipient_email = (auth.jwt() ->> 'email')
    or public.is_staff()
  );

drop policy if exists "Users can buy gift cards" on public.gift_cards;
create policy "Users can buy gift cards"
  on public.gift_cards for insert
  with check (
    auth.uid() is not null
    and (buyer_user_id = auth.uid() or public.is_staff())
  );

drop policy if exists "Staff can update gift cards" on public.gift_cards;
create policy "Staff can update gift cards"
  on public.gift_cards for update
  using (public.is_staff());

-- =========================================================
-- 12) FAVORITOS
-- =========================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.favorites enable row level security;

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);
drop policy if exists "Users can add own favorites" on public.favorites;
create policy "Users can add own favorites" on public.favorites for insert with check (auth.uid() = user_id);
drop policy if exists "Users can remove own favorites" on public.favorites;
create policy "Users can remove own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- =========================================================
-- 13) AVATARES (fotos que el dueño sube para que el cliente elija)
-- =========================================================
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.avatars enable row level security;

drop policy if exists "Anyone can view avatars" on public.avatars;
create policy "Anyone can view avatars" on public.avatars for select using (true);
drop policy if exists "Staff can insert avatars" on public.avatars;
create policy "Staff can insert avatars" on public.avatars for insert with check (public.is_staff());
drop policy if exists "Staff can delete avatars" on public.avatars;
create policy "Staff can delete avatars" on public.avatars for delete using (public.is_staff());

-- =========================================================
-- 14) ÓRDENES / PEDIDOS
-- =========================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  table_number text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  payment_method text,
  payment_breakdown jsonb not null default '[]'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  branch text,
  customer_gender text,
  customer_age int,
  party_size int not null default 1,
  status text not null default 'nueva' check (status in ('nueva','en_preparacion','lista','entregada')),
  created_at timestamptz not null default now()
);
alter table public.orders add column if not exists payment_breakdown jsonb not null default '[]'::jsonb;

alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (user_id = auth.uid() or public.is_order_staff());

-- El checkout permite pedir como invitado (sin cuenta), así que cualquiera
-- puede crear un pedido — igual que hoy cualquiera puede pedir en el local.
drop policy if exists "Anyone can place an order" on public.orders;
create policy "Anyone can place an order"
  on public.orders for insert
  with check (true);

drop policy if exists "Order staff can update orders" on public.orders;
create policy "Order staff can update orders"
  on public.orders for update
  using (public.is_order_staff());

drop policy if exists "Order staff can delete orders" on public.orders;
create policy "Order staff can delete orders"
  on public.orders for delete
  using (public.is_order_staff());

-- habilita las actualizaciones en tiempo real que usan los avisos de pedidos
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gift_cards'
  ) then
    alter publication supabase_realtime add table public.gift_cards;
  end if;
end $$;

-- =========================================================
-- 15) FUNCIONES RPC que usa la página (carrito, gift cards, Early Bird)
-- =========================================================

-- Paga con el balance de gift card del usuario logueado.
create or replace function public.pay_with_gift_card(amount_input numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  bal numeric;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para pagar con gift card.';
  end if;

  select gift_card_balance into bal from public.profiles where id = auth.uid() for update;

  if bal is null or bal < amount_input then
    raise exception 'Balance de gift card insuficiente.';
  end if;

  update public.profiles set gift_card_balance = gift_card_balance - amount_input where id = auth.uid();
end;
$$;

-- Canjea un código de gift card y suma el monto al balance del usuario logueado.
create or replace function public.redeem_gift_card(code_input text)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  gc record;
  redeemer_name text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para canjear una gift card.';
  end if;

  select * into gc from public.gift_cards where upper(code) = upper(trim(code_input)) for update;

  if not found then
    raise exception 'Ese código no existe.';
  end if;
  if gc.status = 'canjeada' then
    raise exception 'Esa gift card ya fue canjeada.';
  end if;

  select name into redeemer_name from public.profiles where id = auth.uid();

  update public.gift_cards
    set status = 'canjeada', redeemed_by = auth.uid(), redeemed_by_name = coalesce(redeemer_name, ''), redeemed_at = now()
    where id = gc.id;

  update public.profiles set gift_card_balance = gift_card_balance + gc.amount where id = auth.uid();

  return gc.amount;
end;
$$;

-- Registra (o consulta) el intento de Early Bird de una sucursal.
-- Devuelve null si el Early Bird no aplica (apagado o fuera de horario),
-- {"outcome":"winner", ...} si esta orden gana el premio del día, o
-- {"outcome":"in_window_no_win", ...} si ya había un ganador hoy.
create or replace function public.try_claim_early_bird(
  branch_input text,
  order_id_input uuid,
  customer_name_input text,
  user_id_input uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  s record;
  today date := current_date;
  now_time time := current_time;
  win record;
begin
  if branch_input is null then
    return null;
  end if;

  select * into s from public.early_bird_settings where branch = branch_input;
  if not found or not s.enabled then
    return null;
  end if;

  -- ventana horaria (usa la hora del servidor de Supabase, en UTC salvo que
  -- ajustes la zona horaria del proyecto)
  if s.start_time <= s.end_time then
    if now_time < s.start_time or now_time > s.end_time then
      return null;
    end if;
  else
    if now_time < s.start_time and now_time > s.end_time then
      return null;
    end if;
  end if;

  select * into win from public.early_bird_wins where branch = branch_input and win_date = today;
  if found then
    return jsonb_build_object('outcome', 'in_window_no_win', 'prize_description', s.prize_description);
  end if;

  begin
    insert into public.early_bird_wins (branch, win_date, customer_name, user_id, order_id)
    values (branch_input, today, customer_name_input, user_id_input, order_id_input);
  exception when unique_violation then
    return jsonb_build_object('outcome', 'in_window_no_win', 'prize_description', s.prize_description);
  end;

  return jsonb_build_object(
    'outcome', 'winner',
    'prize_description', s.prize_description,
    'discount_any_beverage', s.discount_any_beverage,
    'prize_item_id', s.prize_item_id
  );
end;
$$;

-- =========================================================
-- 16) STORAGE: bucket público "fotos" (productos, banners, avatares, sitio)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to fotos" on storage.objects;
create policy "Public read access to fotos"
  on storage.objects for select
  using (bucket_id = 'fotos');

drop policy if exists "Staff can upload to fotos" on storage.objects;
create policy "Staff can upload to fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos' and public.is_staff());

drop policy if exists "Staff can update fotos" on storage.objects;
create policy "Staff can update fotos"
  on storage.objects for update
  using (bucket_id = 'fotos' and public.is_staff());

drop policy if exists "Staff can delete fotos" on storage.objects;
create policy "Staff can delete fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos' and public.is_staff());

-- =========================================================
-- Listo. Para crear tu cuenta de dueño:
-- 1. Entra a la página → "Regístrate" → crea una cuenta normal (queda como "cliente").
-- 2. En Supabase → Table Editor → tabla "profiles" → busca tu fila (por tu correo
--    en Authentication → Users) → cambia la columna "role" de "cliente" a "staff".
-- 3. Vuelve a entrar a la página con esa cuenta: ya tendrás el panel de dueño
--    completo (Menú, Órdenes, Estadísticas, Cuenta → personalización).
--
-- El rol "comensal" es para dar acceso solo a la pantalla de Órdenes (por si
-- quieres que un mesero marque pedidos como listos sin darle acceso al resto
-- del panel de dueño) — se activa de la misma manera, cambiando "role" a
-- "comensal" en esa misma tabla.
-- =========================================================
