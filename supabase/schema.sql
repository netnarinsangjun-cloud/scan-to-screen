-- =============================================================================
-- Scan to Screen — Supabase schema
-- Run this whole file once in Supabase → SQL Editor. It is idempotent: running
-- it again will not duplicate rows or fail on existing objects.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  barcode_id  text unique not null,
  title       text not null,
  description text,
  price       numeric(12, 2),
  image_url   text,
  video_url   text,          -- optional; autoplayed muted + looped behind the product
  created_at  timestamptz default now()
);

create table if not exists public.tv_state (
  id                 integer primary key check (id = 1),   -- singleton row
  current_barcode_id text references public.products (barcode_id)
                       on update cascade
                       on delete set null,
  updated_at         timestamptz default now()
);

-- NOTE: updated_at is intentionally written by the client on every scan
-- (not by a trigger). The TV uses the exact value it wrote to de-duplicate
-- its own Realtime echo, and every scan — even of the same barcode — writes a
-- new timestamp, which is what restarts the 30 s countdown.

-- -----------------------------------------------------------------------------
-- 2. Realtime
-- -----------------------------------------------------------------------------
-- Full replica identity so UPDATE payloads always contain the complete row.
alter table public.tv_state replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tv_state'
  ) then
    alter publication supabase_realtime add table public.tv_state;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------------------------
-- ⚠️ INTENTIONALLY PERMISSIVE — designed for a short-lived event booth.
-- Anyone holding the public anon key can read products and change what the TV
-- shows. That is acceptable for a trade-show kiosk, but do NOT reuse these
-- policies for a long-lived / public production system. After the event,
-- rotate the anon key or drop the update policy.
alter table public.products enable row level security;
alter table public.tv_state enable row level security;

drop policy if exists "booth: read products" on public.products;
create policy "booth: read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists "booth: read tv_state" on public.tv_state;
create policy "booth: read tv_state"
  on public.tv_state
  for select
  to anon, authenticated
  using (true);

drop policy if exists "booth: update tv_state" on public.tv_state;
create policy "booth: update tv_state"
  on public.tv_state
  for update
  to anon, authenticated
  using (id = 1)
  with check (id = 1);

grant select on public.products to anon, authenticated;
grant select, update on public.tv_state to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Seed data
-- -----------------------------------------------------------------------------
-- Barcodes are valid EAN-13 codes (Thai GS1 prefix 885) so you can print them
-- as real barcodes as well as QR codes.
insert into public.products (barcode_id, title, description, price, image_url, video_url)
values
  (
    '8850001000019',
    'AERO X PRO Wireless Headphones',
    'หูฟังไร้สายตัดเสียงรบกวนแบบ Adaptive ANC แบตเตอรี่ใช้งานต่อเนื่อง 40 ชั่วโมง พร้อมเสียง Hi-Res Audio',
    12900.00,
    'https://picsum.photos/seed/aero-x-pro/1200/1200',
    null
  ),
  (
    '8850001000026',
    'NEXA Smart Watch S3',
    'สมาร์ทวอทช์จอ AMOLED 1.9" วัดออกซิเจนในเลือดและการนอนหลับ กันน้ำ 5ATM ใช้งานได้นาน 14 วัน',
    8990.00,
    'https://picsum.photos/seed/nexa-watch-s3/1200/1200',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ),
  (
    '8850001000033',
    'LUMA 4K Mini Projector',
    'โปรเจกเตอร์พกพาความละเอียด 4K สว่าง 1,200 ANSI Lumens ปรับโฟกัสอัตโนมัติ พร้อม Android TV ในตัว',
    24500.00,
    'https://picsum.photos/seed/luma-4k-projector/1200/1200',
    null
  ),
  (
    '8850001000040',
    'VOLT 65W GaN Charger',
    'หัวชาร์จเร็ว GaN 65W สามพอร์ต (USB-C ×2, USB-A ×1) ชาร์จโน้ตบุ๊ก แท็บเล็ต และมือถือได้พร้อมกัน',
    1290.00,
    'https://picsum.photos/seed/volt-gan-65w/1200/1200',
    null
  ),
  (
    '8850001000057',
    'ARC Mechanical Keyboard',
    'คีย์บอร์ดเมคานิคอล 75% Hot-swappable สวิตช์ Linear ไฟ RGB ต่อได้ทั้ง Bluetooth, 2.4GHz และสาย USB-C',
    3490.00,
    'https://picsum.photos/seed/arc-keyboard/1200/1200',
    null
  )
on conflict (barcode_id) do update
set title       = excluded.title,
    description = excluded.description,
    price       = excluded.price,
    image_url   = excluded.image_url,
    video_url   = excluded.video_url;

insert into public.tv_state (id, current_barcode_id, updated_at)
values (1, null, now())
on conflict (id) do nothing;
