-- =====================================================================
-- El-Shaddai App - Skema database Supabase
-- Jalankan SELURUH file ini di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempoten).
-- =====================================================================

-- ---------- Tabel ----------

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nama       text not null default '',
  email      text not null default '',
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  tanggal     date not null,
  hari        text not null check (hari in ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
  kategori    text not null check (kategori in ('Persekutuan','Ibadah','Doa')),
  jenis       text not null,
  detail      jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  cover_url   text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- satu jenis kegiatan hanya sekali per tanggal
  unique (tanggal, jenis)
);
create index if not exists activities_tanggal_idx on public.activities (tanggal);

create table if not exists public.activity_photos (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  url         text not null,
  urutan      int  not null default 0
);
create index if not exists activity_photos_activity_idx on public.activity_photos (activity_id, urutan);

create table if not exists public.sermons (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references public.activities(id) on delete cascade,
  judul       text not null default '',
  ayat        text not null default '',
  isi         text not null default '',
  pembicara   text not null default ''
);

-- ---------- Fungsi & trigger ----------

-- Buat baris profil otomatis saat ada akun baru. Role SELALU 'user';
-- nilai role dari metadata pendaftaran diabaikan (anti-eskalasi hak akses).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, email, role)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nama'), ''), split_part(coalesce(new.email, ''), '@', 1)), 100),
    coalesce(new.email, ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Apakah pengguna saat ini admin? (security definer agar tidak rekursif terhadap RLS profiles)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Isi kolom hari dari tanggal dan perbarui updated_at.
create or replace function public.activities_before_write()
returns trigger
language plpgsql
as $$
begin
  new.hari := (array['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'])[extract(isodow from new.tanggal)::int];
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists activities_before_write on public.activities;
create trigger activities_before_write
  before insert or update on public.activities
  for each row execute function public.activities_before_write();

-- ---------- Row Level Security ----------

alter table public.profiles        enable row level security;
alter table public.activities      enable row level security;
alter table public.activity_photos enable row level security;
alter table public.sermons         enable row level security;

revoke all on public.profiles, public.activities, public.activity_photos, public.sermons from anon;

-- profiles: pengguna melihat profilnya sendiri, admin melihat semua.
-- TIDAK ada policy INSERT/UPDATE/DELETE: role hanya bisa diubah lewat SQL Editor / service role.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- activities, activity_photos, sermons:
-- semua pengguna yang login boleh SELECT; hanya admin yang boleh INSERT/UPDATE/DELETE.
do $$
declare t text;
begin
  foreach t in array array['activities', 'activity_photos', 'sermons'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$I', t);

    execute format('create policy "%1$s_select" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "%1$s_insert" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "%1$s_update" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s_delete" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ---------- Storage: bucket foto ----------
-- Bucket publik (URL foto bisa dimuat tag <img>), batas 5 MB, hanya JPG/PNG/WebP.
-- Hanya admin yang boleh mengunggah/mengubah/menghapus.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('activity-photos', 'activity-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "activity_photos_storage_select" on storage.objects;
drop policy if exists "activity_photos_storage_insert" on storage.objects;
drop policy if exists "activity_photos_storage_update" on storage.objects;
drop policy if exists "activity_photos_storage_delete" on storage.objects;

-- SELECT dibutuhkan agar operasi hapus/ganti oleh admin berjalan di Storage API.
create policy "activity_photos_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'activity-photos');

create policy "activity_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'activity-photos' and public.is_admin());

create policy "activity_photos_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'activity-photos' and public.is_admin())
  with check (bucket_id = 'activity-photos' and public.is_admin());

create policy "activity_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'activity-photos' and public.is_admin());
