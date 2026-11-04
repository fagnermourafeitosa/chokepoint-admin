import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The development server address and the API it proxies come from the
// environment (Admin 038): .env.local, or the process environment, which wins.
const SERVER_VARIABLES = ['ADMIN_DEV_HOST', 'ADMIN_DEV_PORT', 'ADMIN_API_TARGET'] as const;

export default defineConfig(({ command, mode }) => {
  if (command !== 'serve') return { plugins: [react()] };
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of SERVER_VARIABLES) {
    if (!env[name]) throw new Error(`${name} is required (see .env.example).`);
  }
  return {
    plugins: [react()],
    server: {
      host: env.ADMIN_DEV_HOST,
      port: Number(env.ADMIN_DEV_PORT),
      strictPort: true,
      proxy: { '/api': { target: env.ADMIN_API_TARGET } },
    },
  };
});
