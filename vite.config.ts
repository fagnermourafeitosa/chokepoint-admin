import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The development server address and the API it proxies come from the
// environment (Admin 038): .env.local, or the process environment, which wins.
// ADMIN_PUBLIC_ORIGIN is the address the browser uses when the local Envoy
// serves the Admin (Backend 071, decision 6): Vite accepts that host and its
// reload WebSocket goes through Envoy on port 443.
const SERVER_VARIABLES = ['ADMIN_DEV_HOST', 'ADMIN_DEV_PORT', 'ADMIN_API_TARGET'] as const;

export default defineConfig(({ command, mode }) => {
  if (command !== 'serve') return { plugins: [react()] };
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of SERVER_VARIABLES) {
    if (!env[name]) throw new Error(`${name} is required (see .env.example).`);
  }
  const publicOrigin = env.ADMIN_PUBLIC_ORIGIN ? new URL(env.ADMIN_PUBLIC_ORIGIN) : undefined;
  return {
    plugins: [react()],
    server: {
      host: env.ADMIN_DEV_HOST,
      port: Number(env.ADMIN_DEV_PORT),
      strictPort: true,
      proxy: { '/api': { target: env.ADMIN_API_TARGET } },
      ...(publicOrigin && {
        allowedHosts: [publicOrigin.hostname],
        hmr: { protocol: 'wss', host: publicOrigin.hostname, clientPort: 443 },
      }),
    },
  };
});
