DeepInfluence — Guide de démarrage (Backend, Frontend, Caddy)

Prérequis
- Node.js LTS (>= 18) + npm
- Caddy v2 installé et accessible dans le PATH
- Certificats TLS (fichiers .pem) pour l’hôte/IP que vous utilisez

Arborescence
- backend/ — API Express + Socket.IO (port 3001)
- frontend/ — Next.js (port 3000)
- infra/Caddyfile — Reverse proxy TLS vers frontend + backend
- certs/ — Placez vos certificats TLS ici (à créer si absent)

1) Backend (API)
- Copier/adapter backend/.env (exemple minimal):
  PORT=3001
  NODE_ENV=development
  # Ajoutez vos variables DB/SECRETS selon vos besoins

- Installer et démarrer:
  cd backend
  npm install
  npm run dev   # en développement (nodemon)
  # ou
  npm start     # en production

2) Frontend (Next.js)
- Configurer frontend/.env.local (exemple):
  NEXT_PUBLIC_API_URL=https://10.141.163.221:8443/api
  NEXT_PUBLIC_BACKEND_URL=https://10.141.163.221:8443

- Installer et démarrer:
  cd frontend
  npm install
  npm run dev   # http://localhost:3000

3) Caddy (reverse proxy + TLS)
- Placez vos certificats dans le dossier certs/ à la racine du projet:
  certs/10.141.163.221.pem
  certs/10.141.163.221-key.pem

- Vérifiez infra/Caddyfile (déjà configuré pour pointer vers ./certs):
  https://10.141.163.221:8443 {
    tls ./certs/10.141.163.221.pem ./certs/10.141.163.221-key.pem

    encode gzip

    @api path /api/*
    reverse_proxy @api http://localhost:3001

    @socket path /socket.io*
    reverse_proxy @socket http://localhost:3001

    @health path /health
    reverse_proxy @health http://localhost:3001

    reverse_proxy http://localhost:3000
  }

- Démarrer Caddy depuis la racine du projet:
  # Windows (PowerShell ou CMD)
  caddy start --config ".\infra\Caddyfile"
  # Linux/macOS
  caddy start --config ./infra/Caddyfile

- Arrêter Caddy:
  caddy stop

Notes & Dépannage
- Exécutez Caddy depuis la racine du repo pour que les chemins relatifs ./certs fonctionnent.
- Adaptez l’IP/nom d’hôte dans frontend/.env.local et infra/Caddyfile si nécessaire.
- Si vous utilisez d’autres ports localement, alignez-les dans le Caddyfile (reverse_proxy) et dans les .env.
- En développement, commencez d’abord backend (3001), puis frontend (3000), puis Caddy (8443).

