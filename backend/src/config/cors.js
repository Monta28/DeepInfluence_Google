// backend/src/config/cors.js
// Autorise le front local + le domaine Vercel fourni,
// et permet d'étendre via variables d'env pour previews
const baseOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean).map(s => s.trim());

const suffixes = (process.env.CORS_ALLOWED_SUFFIXES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

module.exports = {
  origin: (origin, callback) => {
    // Autoriser requêtes sans en-tête Origin (ex: SSR, cURL, health)
    if (!origin) return callback(null, true);
    if (baseOrigins.includes(origin)) return callback(null, true);
    if (suffixes.some(suf => origin.endsWith(suf))) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
