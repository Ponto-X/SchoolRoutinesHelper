const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// Runtime config injected from environment variables
const runtimeConfig = {
  VITE_SUPABASE_URL:        process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY:   process.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_WHATSAPP_PROVIDER:   process.env.VITE_WHATSAPP_PROVIDER || '',
  VITE_EVOLUTION_API_URL:   process.env.VITE_EVOLUTION_API_URL || '',
  VITE_EVOLUTION_API_KEY:   process.env.VITE_EVOLUTION_API_KEY || '',
  VITE_EVOLUTION_INSTANCE:  process.env.VITE_EVOLUTION_INSTANCE || '',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // /config endpoint — returns env vars to the frontend at runtime
  if (urlPath === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(runtimeConfig));
    return;
  }

  const tryFile = (fp) => {
    try {
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) return tryFile(path.join(fp, 'index.html'));
      const ext = path.extname(fp).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(fp).pipe(res);
      return true;
    } catch { return false; }
  };

  if (!tryFile(path.join(DIST, urlPath))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(DIST, 'index.html')).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('--- Runtime Config ---');
  console.log('Supabase URL:', runtimeConfig.VITE_SUPABASE_URL ? '✅ set' : '❌ missing');
  console.log('WhatsApp provider:', runtimeConfig.VITE_WHATSAPP_PROVIDER || '❌ not set');
  console.log('Evolution URL:', runtimeConfig.VITE_EVOLUTION_API_URL || '❌ not set');
  console.log('Evolution Instance:', runtimeConfig.VITE_EVOLUTION_INSTANCE || '❌ not set');
  console.log('---------------------');
});
