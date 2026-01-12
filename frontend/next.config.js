/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppression de "output: export" qui est incompatible avec les API routes et routes dynamiques
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Transpile Stream SDK packages to fix "Class constructor cannot be invoked without 'new'" error
  transpilePackages: [
    '@stream-io/video-react-sdk',
    '@stream-io/video-client',
    '@stream-io/video-react-bindings',
  ],
  async rewrites() {
    // Route toutes les requêtes front -> backend API
    // - en prod/préprod (Vercel): utilise NEXT_PUBLIC_API_URL (ex: https://<render>.onrender.com/api)
    // - en dev local: fallback vers http://localhost:3001/api
    const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim())
      || ((process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim())
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '')}/api`
          : 'http://localhost:3001/api');
    const destination = apiBase.replace(/\/$/, '') + '/:path*';
    return [
      {
        source: '/api/:path*',
        destination,
      },
    ];
  },
};

module.exports = nextConfig;
