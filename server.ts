import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Setup development server or production static serving
async function bootstrap() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode. Serving pre-compiled static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server running successfully on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap the Express+Vite application:', err);
  process.exit(1);
});
