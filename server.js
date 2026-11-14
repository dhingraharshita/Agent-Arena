import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser for standalone Node without external dotenv dependency
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnvFile();

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = path.resolve(__dirname, 'dist');

// Dynamic import of apiRouter
async function startServer() {
  let handleApiRequest = null;
  try {
    const apiModule = await import('./server/apiRouter.ts');
    handleApiRequest = apiModule.handleApiRequest;
  } catch (err) {
    console.warn('Note: TypeScript API router running via build mode.');
  }

  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    // Route /api/*
    if (url.startsWith('/api') && handleApiRequest) {
      try {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    // Static file serving from dist/
    let filePath = path.join(DIST_DIR, url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found. Run "npm run build" first to generate dist/');
    }
  });

  server.listen(PORT, () => {
    console.log(`AgentArena Server listening on http://localhost:${PORT}`);
    console.log(`Gemini API configured: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO (Demo Mode Active)'}`);
  });
}

startServer();
