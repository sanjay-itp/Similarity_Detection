import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// During development every request to /api is forwarded to the backend.
// Change VITE_BACKEND_URL in .env to point at wherever the backend runs.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
