import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/apiRouter';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Ensure loaded env vars are available in process.env on the server side
  for (const [key, val] of Object.entries(env)) {
    if (!process.env[key] && val) {
      process.env[key] = val;
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'agent-arena-api-plugin',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api')) {
              try {
                const handled = await handleApiRequest(req, res);
                if (!handled) next();
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    server: {
      port: 3000,
      open: false
    }
  };
});
