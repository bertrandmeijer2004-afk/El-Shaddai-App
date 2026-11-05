/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true }, // proyek belum memakai ESLint; hapus baris ini jika menambahkannya
};

export default nextConfig;
