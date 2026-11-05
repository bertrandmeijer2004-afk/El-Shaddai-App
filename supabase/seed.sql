-- =====================================================================
-- El-Shaddai App - Data contoh
-- Jalankan SETELAH schema.sql, di Supabase Dashboard > SQL Editor.
-- Tanggal dihitung otomatis: minggu berjalan (Senin-Minggu, WIB) + Minggu sebelumnya,
-- jadi tampilan beranda langsung terisi kapan pun file ini dijalankan.
-- Aman dijalankan ulang (data yang sama tidak diduplikasi).
-- =====================================================================

do $$
declare
  w date := date_trunc('week', now() at time zone 'Asia/Jakarta')::date; -- Senin minggu ini (WIB)
begin
  insert into public.activities (tanggal, hari, kategori, jenis, detail) values
  -- Senin
  (w, 'Senin', 'Persekutuan', 'Persekutuan Kaleb', '{
    "worship_leader": "Daniel Prasetyo",
    "pelayan": "Rina Kristanti, Yohanes Adi",
    "lokasi": "Aula Gereja",
    "jam": {"mulai": "19:00", "selesai": "21:00"},
    "pengumuman": "Mohon membawa Alkitab masing-masing. Setelah persekutuan ada ramah tamah ringan."
  }'::jsonb),
  -- Selasa
  (w + 1, 'Selasa', 'Persekutuan', 'Persekutuan Yosua', '{
    "pelayan": "Markus Wijaya, Esther Lie",
    "lokasi": "Ruang Serbaguna",
    "jam": {"mulai": "19:00", "selesai": "21:00"},
    "pengumuman": "Tema bulan ini: Setia dalam perkara kecil."
  }'::jsonb),
  -- Rabu
  (w + 2, 'Rabu', 'Ibadah', 'Ibadah Tengah Minggu', '{
    "worship_leader": "Samuel Hartono",
    "singers": "Grace, Debora, Timotius",
    "pelayan_musik": "Gitar: Andre; Keyboard: Lydia; Drum: Joshua",
    "mulmed": "Kevin, Natalia",
    "lokasi": "Sanctuary Utama",
    "jam": {"mulai": "19:00", "selesai": "20:30"},
    "pengumuman": "Persembahan khusus untuk pembangunan ruang Sekolah Minggu."
  }'::jsonb),
  -- Kamis
  (w + 3, 'Kamis', 'Doa', 'Doa Pelayan', '{
    "pemimpin": "Pdt. Yusuf Santoso",
    "lokasi": "Ruang Doa Lantai 2",
    "jam": {"mulai": "17:30", "selesai": "18:30"},
    "pengumuman": "Seluruh pelayan diharapkan hadir tepat waktu."
  }'::jsonb),
  (w + 3, 'Kamis', 'Persekutuan', 'Persekutuan Argopuro', '{
    "worship_leader": "Maria Handayani",
    "lokasi": "Aula Gereja",
    "jam": {"mulai": "19:00", "selesai": "20:30"},
    "pengumuman": "Terbuka untuk seluruh jemaat. Mari ajak teman dan keluarga."
  }'::jsonb),
  (w + 3, 'Kamis', 'Doa', 'Doa Malam', '{
    "lokasi": "Sanctuary Utama",
    "jam": {"mulai": "21:00", "selesai": "22:00"},
    "pengumuman": "Doa syafaat untuk jemaat, bangsa, dan pelayanan gereja."
  }'::jsonb),
  -- Jumat (hanya satu kegiatan: Persekutuan Bapak/Ibu ATAU Doa Pelayan Perjamuan Suci)
  (w + 4, 'Jumat', 'Persekutuan', 'Persekutuan Bapak/Ibu', '{
    "worship_leader": "Bpk. Hendra",
    "doa_pembuka": "Ibu Sari",
    "doa_firman": "Bpk. Gideon",
    "kolektan": "Bpk. Agus, Ibu Ratna",
    "lokasi": "Aula Gereja",
    "jam": {"mulai": "19:00", "selesai": "21:00"},
    "pengumuman": "Ibadah Perjamuan Suci dilaksanakan pada Minggu pekan depan."
  }'::jsonb),
  -- Sabtu
  (w + 5, 'Sabtu', 'Persekutuan', 'Persekutuan Remaja', '{
    "worship_leader": "Kezia",
    "singers": "Naomi, Jonathan, Ruth",
    "doa_pembuka": "Elia",
    "kolektan": "Bryan, Salome",
    "doa_kolektan": "Salome",
    "doa_firman": "Abigail",
    "mulmed": "Kevin",
    "lokasi": "Aula Gereja",
    "jam": {"mulai": "16:00", "selesai": "18:00"},
    "pengumuman": "Setelah persekutuan ada latihan drama untuk perayaan akhir bulan."
  }'::jsonb),
  -- Minggu
  (w + 6, 'Minggu', 'Ibadah', 'Ibadah Raya', '{
    "worship_leader": "Samuel Hartono",
    "singers": "Grace, Debora, Timotius, Ester",
    "doa_pembuka": "Pnt. Budi",
    "kolektan": "Bpk. Agus, Bpk. Hendra, Ibu Ratna",
    "doa_kolektan": "Ibu Ratna",
    "doa_firman": "Pnt. Yohana",
    "usher": "Andreas, Mira, Paulus, Citra",
    "mulmed": "Kevin, Natalia",
    "tamborin": "Tim Tamborin Remaja",
    "banners": "Tim Banners Pemuda",
    "lokasi": "Sanctuary Utama",
    "jam": {"mulai": "08:00", "selesai": "10:00"},
    "pengumuman": "Rapat jemaat dilaksanakan setelah ibadah di Aula Gereja."
  }'::jsonb),
  (w + 6, 'Minggu', 'Persekutuan', 'Persekutuan Sekolah Minggu', '{
    "prepare": "Kak Melisa",
    "doa_pembuka": "Kak Rendy",
    "doa_gsm": "Kak Natasya",
    "worship_leader": "Kak Dina",
    "kolektan": "Kak Felix",
    "doa_firman": "Kak Melisa",
    "usher": "Kak Joy",
    "mulmed": "Kak Aldo",
    "lokasi": "Ruang Sekolah Minggu",
    "jam": {"mulai": "08:00", "selesai": "09:30"},
    "pengumuman": "Anak-anak diharapkan membawa buku catatan dan alat tulis."
  }'::jsonb),
  -- Minggu sebelumnya (agar "Firman Terbaru" langsung terisi)
  (w - 1, 'Minggu', 'Ibadah', 'Ibadah Raya', '{
    "worship_leader": "Maria Handayani",
    "singers": "Grace, Debora, Timotius",
    "doa_pembuka": "Pnt. Yohana",
    "kolektan": "Bpk. Agus, Ibu Ratna",
    "usher": "Andreas, Mira",
    "mulmed": "Kevin",
    "lokasi": "Sanctuary Utama",
    "jam": {"mulai": "08:00", "selesai": "10:00"}
  }'::jsonb)
  on conflict (tanggal, jenis) do nothing;

  -- Firman (contoh; ringkasan ditulis sendiri, bukan kutipan teks Alkitab)
  insert into public.sermons (activity_id, judul, ayat, isi, pembicara)
  select a.id, v.judul, v.ayat, v.isi, v.pembicara
  from (values
    (w + 2, 'Ibadah Tengah Minggu', 'Hidup yang Dipersembahkan', 'Roma 12:1-2',
      '<p>Hidup sebagai persembahan yang hidup berarti seluruh keseharian kita, pekerjaan, keluarga, dan pelayanan, menjadi ibadah bagi Tuhan.</p><ul><li>Persembahkan diri, bukan hanya waktu.</li><li>Biarkan pikiran diperbarui oleh Firman.</li><li>Ujilah kehendak Allah dengan hati yang taat.</li></ul>',
      'Pdt. Yusuf Santoso'),
    (w + 6, 'Ibadah Raya', 'Tinggal di dalam Kristus', 'Yohanes 15:1-8',
      '<p>Yesus adalah pokok anggur yang benar. Cabang tidak dapat berbuah dari dirinya sendiri; ia berbuah karena tetap tinggal pada pokoknya.</p><blockquote>Tinggal di dalam Kristus adalah sumber buah yang bertahan.</blockquote><p>Mari menata hidup doa dan firman agar kita terus terhubung dengan Sang Pokok Anggur.</p>',
      'Pdt. Yusuf Santoso')
  ) as v(tgl, jenis, judul, ayat, isi, pembicara)
  join public.activities a on a.tanggal = v.tgl and a.jenis = v.jenis
  on conflict (activity_id) do nothing;

  insert into public.sermons (activity_id, judul, ayat, isi, pembicara)
  select a.id, 'Bersorak bagi Tuhan', 'Mazmur 100:1-5',
    '<p>Mazmur ini mengajak seluruh bumi bersorak, beribadah dengan sukacita, dan masuk ke pelataran-Nya dengan syukur.</p><p>Ucapan syukur bukan sekadar perasaan, melainkan keputusan untuk mengingat kebaikan Tuhan setiap hari.</p>',
    'Pdt. Yusuf Santoso'
  from public.activities a
  where a.tanggal = w - 1 and a.jenis = 'Ibadah Raya'
  on conflict (activity_id) do nothing;
end $$;
