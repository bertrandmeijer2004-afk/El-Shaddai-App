/**
 * Membuat (atau menaikkan) akun admin.
 *
 * Pemakaian:
 *   npm run create-admin -- email@gereja.org "Sandi-Kuat-Anda" "Nama Admin"
 *
 * Tanpa argumen, dibuat akun contoh admin@elshaddai.test (GANTI sandinya di produksi!).
 *
 * Butuh di .env.local: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.
 * Service role key bersifat rahasia: jangan dipakai di browser dan jangan di-commit.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local terlebih dahulu.");
  process.exit(1);
}

const [, , emailArg, passwordArg, namaArg] = process.argv;
const usingDemo = !emailArg && !process.env.ADMIN_EMAIL;
const email = (emailArg || process.env.ADMIN_EMAIL || "admin@elshaddai.test").trim().toLowerCase();
// Sandi bisa juga lewat variabel lingkungan ADMIN_PASSWORD agar tidak tercatat di riwayat shell.
const password = passwordArg || process.env.ADMIN_PASSWORD || "GantiSandiIni!2026";
const nama = namaArg || "Admin El-Shaddai";

if (password.length < 8) {
  console.error("Sandi minimal 8 karakter.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

let user = await findUserByEmail(email);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama },
  });
  if (error) {
    console.error("Gagal membuat akun:", error.message);
    process.exit(1);
  }
  user = data.user;
  console.log(`Akun dibuat: ${email}`);
} else {
  console.log(`Akun sudah ada: ${email} (sandi tidak diubah)`);
}

// Trigger database sudah membuat baris profiles; pastikan ada lalu set role = admin.
const { error: upsertError } = await admin
  .from("profiles")
  .upsert({ id: user.id, email, nama, role: "admin" }, { onConflict: "id" });
if (upsertError) {
  console.error("Gagal mengatur role admin:", upsertError.message);
  process.exit(1);
}

console.log(`Role admin aktif untuk ${email}.`);
if (usingDemo) {
  console.log("PERINGATAN: ini akun contoh dengan sandi publik. Ganti sandi atau buat admin sendiri sebelum dipakai nyata.");
}
