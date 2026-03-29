import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 - dominio público del bucket (configurar en .env)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // Si usás dominio personalizado en R2 (recomendado para producción)
      // Reemplazá 'tu-dominio.com' con tu dominio real
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || '*.r2.dev',
      },
      // Supabase (para avatares de usuarios u otras imágenes)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
