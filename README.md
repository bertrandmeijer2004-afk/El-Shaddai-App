# El-Shaddai App

Aplikasi web responsif (mobile-first) untuk mengelola dan menampilkan jadwal kegiatan gereja.
Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Framer Motion · Supabase (Auth, PostgreSQL, Storage).
Seluruh antarmuka berbahasa Indonesia, zona waktu WIB.

## 1. Menjalankan

Prasyarat: Node.js 20.6+ dan sebuah proyek Supabase (gratis cukup).

```bash
npm install
cp .env.example .env.local      # lalu isi nilainya (lihat langkah 2)
npm run dev                      # http://localhost:3000
```

### 2. Menyiapkan Supabase

1. Buat proyek di <https://supabase.com>.
2. **Project Settings → API**: salin `Project URL` ke `NEXT_PUBLIC_SUPABASE_URL` dan `anon public` key ke
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`.
3. **SQL Editor**: jalankan seluruh isi `supabase/schema.sql` (tabel, RLS, trigger, bucket foto).
4. **SQL Editor**: jalankan `supabase/seed.sql` (data contoh satu minggu penuh Senin–Minggu pada minggu berjalan,
   ditambah Ibadah Raya minggu lalu dengan Firman). Tanggalnya dihitung otomatis sehingga beranda langsung terisi.
5. (Opsional, disarankan untuk uji coba) **Authentication → Providers → Email**: matikan *Confirm email* agar
   pendaftaran jemaat langsung masuk. Jika dibiarkan aktif, jemaat diminta mengonfirmasi lewat email; atur
   **Authentication → URL Configuration → Site URL** ke alamat aplikasi Anda.

### 3. Akun admin contoh

Tidak ada pendaftaran admin di aplikasi. Buat admin lewat skrip (memakai service role key, hanya dijalankan di komputer Anda):

1. Isi `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` (Project Settings → API → `service_role`). Jangan pernah
   membagikannya atau memakainya di kode browser.
2. Jalankan:

```bash
npm run create-admin                       # akun contoh: admin@elshaddai.test / GantiSandiIni!2026
npm run create-admin -- email@gereja.org "SandiKuatAnda" "Nama Admin"   # akun sungguhan
```

Masuk di `/admin/login`. **Akun contoh bersandi publik: ganti atau hapus sebelum dipakai nyata.**

## 4. Menambah akun admin baru

Pilih salah satu:

- **Skrip** (di atas): `npm run create-admin -- email "sandi" "nama"`. Jika email sudah terdaftar, role-nya dinaikkan menjadi admin.
- **Dashboard Supabase**, tanpa kunci rahasia:
  1. Authentication → Users → *Add user* (isi email + password, centang *Auto Confirm User*), atau minta orangnya mendaftar sebagai jemaat dulu.
  2. SQL Editor:
     ```sql
     update public.profiles set role = 'admin' where email = 'email@gereja.org';
     ```
- Untuk mencabut hak admin: `update public.profiles set role = 'user' where email = '...';`

## 5. Mengubah isi dan konfigurasi

| Yang diubah | File |
| --- | --- |
| Jenis kegiatan, field detail per jenis, aturan hari | `src/config/activities.ts` |
| Nama gereja, tagline, **semboyan (marquee)**, **alamat**, kontak, foto hero | `src/config/site.ts` |
| Warna | `src/app/globals.css` (variabel `:root` dan `.dark`) |

Detail kegiatan disimpan sebagai JSONB (`activities.detail`), jadi menambah/mengubah field di
`src/config/activities.ts` tidak memerlukan migrasi database. Field yang kosong tidak ditampilkan ke jemaat.

> **Perlu Anda isi:** `semboyan` dan `alamat` di `src/config/site.ts` masih berisi `[ISI SEMBOYAN]` dan `[ISI ALAMAT GEREJA]`.
> Foto hero memakai `public/hero.svg` sampai Anda mengisi `NEXT_PUBLIC_HERO_IMAGE_URL` atau mengganti file itu.

## 6. Keamanan

- **Middleware** (`src/middleware.ts`): halaman jemaat wajib login; `/admin/*` hanya untuk `role = 'admin'`
  (jemaat dialihkan ke `/beranda`). Layout panel admin dan setiap Server Action memeriksa role lagi.
- **RLS**: pengguna login boleh `SELECT`; hanya admin yang boleh `INSERT/UPDATE/DELETE` pada `activities`,
  `activity_photos`, `sermons`, dan objek Storage. Tabel `profiles` tidak punya policy tulis, sehingga role
  tidak bisa diubah dari aplikasi. Trigger pendaftaran selalu menetapkan `role = 'user'`.
- Firman (rich text) disaring di server dengan `sanitize-html` sebelum disimpan dan saat ditampilkan.
- URL foto dari klien divalidasi harus berasal dari bucket `activity-photos` milik proyek ini.
- Bucket foto bersifat **publik** (agar `<img>` dapat memuat). Siapa pun yang memegang URL file dapat membukanya;
  URL memakai UUID acak sehingga tidak dapat ditebak, tetapi bukan rahasia mutlak.

## 7. Perilaku yang perlu diketahui

- **Jumat**: "Persekutuan Bapak/Ibu ATAU Doa Pelayan Perjamuan Suci" diterapkan sebagai satu kegiatan per tanggal Jumat.
  Jika kedua kegiatan boleh bersamaan, kosongkan `EXCLUSIVE_DAYS` di `src/config/activities.ts`.
- Satu jenis kegiatan hanya boleh sekali per tanggal (`unique (tanggal, jenis)`).
- **Ulangi setiap minggu** dan **Duplikat dari minggu lalu** menyalin detail dan foto sampul. Firman dan galeri
  tidak ikut disalin karena berubah tiap minggu. Tanggal yang sudah terisi dilewati.
- Foto: JPG/PNG/WebP, maks. 15 MB sebelum kompres; dikompres di browser menjadi JPEG maks. 1920 px (target ≤ ~0,8 MB),
  maks. 20 foto galeri. Foto baru baru diunggah saat tombol Simpan ditekan. File yang tak terpakai dihapus dari
  Storage ketika foto diganti atau kegiatan dihapus.
- Kegiatan "Firman Terbaru" di beranda menampilkan Firman dari kegiatan yang tanggalnya sudah tiba (≤ hari ini, WIB).

## 8. Struktur

```
src/
  app/
    page.tsx                  gerbang masuk (3 pilihan)
    masuk, daftar/            login & daftar jemaat
    admin/login/              login admin (tanpa daftar)
    admin/(panel)/            dashboard minggu, tambah & edit kegiatan
    admin/actions.ts          Server Actions: simpan, hapus, duplikat minggu lalu
    (site)/beranda            beranda jemaat
    (site)/kegiatan/[id]      detail kegiatan
  components/                 UI (Calendar, Gallery, Modal, Marquee, admin/…)
  config/                     activities.ts, site.ts
  lib/                        tanggal WIB, validasi, query, klien Supabase
  middleware.ts               proteksi rute
supabase/                     schema.sql, seed.sql
scripts/create-admin.mjs      membuat akun admin
```
