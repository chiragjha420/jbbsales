-- =====================================================================
-- JBB Sales - Production PostgreSQL Database Schema
-- Mobile-First Sales, Profitability & Payment-Proof Management System
-- Jai Balaji Billiards (JBB)
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Profiles Table (Linked to auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null check (role in ('admin', 'salesperson')) default 'salesperson',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_active on public.profiles(active);

-- Auto-create profile trigger when user is added via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_full_name text;
begin
  -- Role resolution: user_metadata first, then 'admin' prefix fallback, else 'salesperson'
  v_role := coalesce(
    new.raw_user_meta_data->>'role',
    case when lower(new.email) like 'admin%' then 'admin' else 'salesperson' end
  );
  if v_role not in ('admin', 'salesperson') then
    v_role := 'salesperson';
  end if;

  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    initcap(split_part(new.email, '@', 1))
  );

  insert into public.profiles (id, email, full_name, role, active)
  values (new.id, new.email, v_full_name, v_role, true)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = coalesce(public.profiles.role, excluded.role);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Products Table
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique not null,
  description text,
  cost_price numeric(12,2) not null check (cost_price >= 0),
  recommended_price numeric(12,2) check (recommended_price is null or recommended_price >= 0),
  minimum_price numeric(12,2) check (minimum_price is null or minimum_price >= 0),
  category text not null default 'Cues',
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_keywords on public.products using gin(keywords);

-- ---------------------------------------------------------------------
-- 3. Product Photos Table
-- ---------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id);

-- ---------------------------------------------------------------------
-- 4. Customers Table
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  contact_person text,
  phone text not null,
  email text,
  address text,
  city text,
  notes text,
  assigned_salesperson_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_assigned on public.customers(assigned_salesperson_id);
create index if not exists idx_customers_name on public.customers(name);
create index if not exists idx_customers_company on public.customers(company);
create index if not exists idx_customers_phone on public.customers(phone);

-- ---------------------------------------------------------------------
-- 5. Sales Sequence & Generation
-- ---------------------------------------------------------------------
create sequence if not exists sale_number_seq start 1;

create or replace function public.generate_sale_number()
returns text as $$
declare
  v_year text := to_char(current_date, 'YYYY');
  v_seq int;
begin
  select nextval('sale_number_seq') into v_seq;
  return 'JBB-' || v_year || '-' || lpad(v_seq::text, 6, '0');
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- 6. Sales Table
-- ---------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text unique not null default public.generate_sale_number(),
  salesperson_id uuid not null references public.profiles(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_name_snapshot text not null,
  sale_date timestamptz not null default now(),
  courier_charge numeric(12,2) not null default 0 check (courier_charge >= 0),
  courier_cost numeric(12,2) not null default 0 check (courier_cost >= 0),
  other_charge numeric(12,2) not null default 0 check (other_charge >= 0),
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  product_revenue numeric(12,2) not null default 0 check (product_revenue >= 0),
  product_cost numeric(12,2) not null default 0 check (product_cost >= 0),
  total_revenue numeric(12,2) not null default 0 check (total_revenue >= 0),
  total_cost numeric(12,2) not null default 0 check (total_cost >= 0),
  gross_profit numeric(12,2) not null default 0,
  gross_margin numeric(6,2) not null default 0,
  payment_status text not null check (payment_status in ('unpaid', 'partially_paid', 'paid', 'overpaid')) default 'unpaid',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_number on public.sales(sale_number);
create index if not exists idx_sales_salesperson on public.sales(salesperson_id);
create index if not exists idx_sales_customer on public.sales(customer_id);
create index if not exists idx_sales_date on public.sales(sale_date desc);
create index if not exists idx_sales_payment_status on public.sales(payment_status);

-- ---------------------------------------------------------------------
-- 7. Sale Items Table (Preserving Historical Snapshot)
-- ---------------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text,
  quantity numeric(10,2) not null check (quantity > 0),
  selling_price numeric(12,2) not null check (selling_price >= 0),
  cost_at_sale numeric(12,2) not null check (cost_at_sale >= 0),
  line_revenue numeric(12,2) not null check (line_revenue >= 0),
  line_cost numeric(12,2) not null check (line_cost >= 0),
  line_profit numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);

-- ---------------------------------------------------------------------
-- 8. Payments Table
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('upi', 'bank_transfer', 'cash', 'other')),
  payment_date timestamptz not null default now(),
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_sale on public.payments(sale_id);
create index if not exists idx_payments_date on public.payments(payment_date desc);

-- ---------------------------------------------------------------------
-- 9. Payment Proofs Table
-- ---------------------------------------------------------------------
create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size numeric(12,0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_proofs_payment on public.payment_proofs(payment_id);
create index if not exists idx_payment_proofs_sale on public.payment_proofs(sale_id);

-- ---------------------------------------------------------------------
-- 10. Audit Logs Table
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  performed_by uuid references public.profiles(id) on delete set null,
  previous_state jsonb,
  new_state jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_user on public.audit_logs(performed_by);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------
-- 11. Storage Buckets Setup
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

-- ---------------------------------------------------------------------
-- 12. Row Level Security Helper & Policies
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.audit_logs enable row level security;

-- Function to check admin status securely
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
create policy "Authenticated users can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Admins can update profiles" on public.profiles
  for update using (public.is_admin());

-- Products Policies: Cost price must be visible to salespeople per spec
create policy "Authenticated users can view products" on public.products
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can create products" on public.products
  for insert with check (auth.role() = 'authenticated');

create policy "Admins or creator can update products" on public.products
  for update using (public.is_admin() or created_by = auth.uid());

-- Product Images Policies
create policy "Authenticated users can view product images" on public.product_images
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert product images" on public.product_images
  for insert with check (auth.role() = 'authenticated');

-- Customers Policies
create policy "Salespeople can view their customers, Admins see all" on public.customers
  for select using (public.is_admin() or assigned_salesperson_id = auth.uid() or created_by = auth.uid());

create policy "Authenticated users can create customers" on public.customers
  for insert with check (auth.role() = 'authenticated');

create policy "Admins or assigned salespeople can update customers" on public.customers
  for update using (public.is_admin() or assigned_salesperson_id = auth.uid());

-- Sales Policies: Salespeople view their own, Admins view all
create policy "Salespeople view own sales, Admins view all" on public.sales
  for select using (public.is_admin() or salesperson_id = auth.uid());

create policy "Authenticated users can insert sales" on public.sales
  for insert with check (auth.role() = 'authenticated');

create policy "Admins can update sales" on public.sales
  for update using (public.is_admin());

-- Sale Items Policies
create policy "Salespeople view own sale items, Admins view all" on public.sale_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.sales where sales.id = sale_items.sale_id and sales.salesperson_id = auth.uid()
    )
  );

create policy "Authenticated users can insert sale items" on public.sale_items
  for insert with check (auth.role() = 'authenticated');

-- Payments Policies
create policy "Salespeople view own payments, Admins view all" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.sales where sales.id = payments.sale_id and sales.salesperson_id = auth.uid()
    )
  );

create policy "Authenticated users can record payments" on public.payments
  for insert with check (auth.role() = 'authenticated');

-- Payment Proofs Policies
create policy "Salespeople view own payment proofs, Admins view all" on public.payment_proofs
  for select using (
    public.is_admin() or exists (
      select 1 from public.sales where sales.id = payment_proofs.sale_id and sales.salesperson_id = auth.uid()
    )
  );

create policy "Authenticated users can upload payment proofs" on public.payment_proofs
  for insert with check (auth.role() = 'authenticated');

-- Audit Logs Policies
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.is_admin());

create policy "Authenticated users can insert audit logs" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- Storage Policies
create policy "Product images readable by authenticated" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Product images uploadable by authenticated" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Payment proofs accessible by authenticated" on storage.objects
  for select using (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');

create policy "Payment proofs uploadable by authenticated" on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');
