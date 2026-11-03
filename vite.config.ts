import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Node-only middleware, deliberately outside the client source graph.
import { createApiHandler } from './server/api.mjs';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
  envPrefix: 'PUBLIC_',
  plugins: [react(), {
    name: 'office-backend',
    configureServer(server) {
      const api = createApiHandler({ env });
      server.middlewares.use((req, res, next) => { void api(req, res).then((handled: boolean) => { if (!handled) next(); }).catch(next); });
    },
  }],
  server: {
    port: 3000,
    host: env.HOST || '127.0.0.1',
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/server/**', '**/.office-data/**'] }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom', 'lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
};
});
