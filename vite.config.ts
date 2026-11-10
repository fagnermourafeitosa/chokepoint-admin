import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The development server address comes from the environment (Admin 038):
// .env.local, or the process environment, which wins. The browser uses the
// Admin only through the local Envoy, at ADMIN_PUBLIC_ORIGIN, which also routes
// /api/v1/ to the backend: there is no Vite proxy (Backend 072, decision 1).
// Vite accepts that host, and its reload WebSocket goes through Envoy on 443.
const SERVER_VARIABLES = ['ADMIN_DEV_HOST', 'ADMIN_DEV_PORT', 'ADMIN_PUBLIC_ORIGIN'] as const;

export default defineConfig(({ command, mode }) => {
  if (command !== 'serve') return { plugins: [react()] };
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of SERVER_VARIABLES) {
    if (!env[name]) throw new Error(`${name} is required (see .env.example).`);
  }
  const publicOrigin = new URL(env.ADMIN_PUBLIC_ORIGIN);
  return {
    plugins: [react()],
    server: {
      host: env.ADMIN_DEV_HOST,
      port: Number(env.ADMIN_DEV_PORT),
      strictPort: true,
      allowedHosts: [publicOrigin.hostname],
      hmr: { protocol: 'wss', host: publicOrigin.hostname, clientPort: 443 },
    },
  };
});
