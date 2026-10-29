const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DCSAI_HOST = 'https://dcsai.fnf.co.kr';

// Proxy: 데이터 API 요청을 dcsai 서버로 중계
app.get('/api/proxy/*', async (req, res) => {
  const targetPath = req.params[0]; // wildcard 이후 경로
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const targetUrl = `${DCSAI_HOST}/${targetPath}${qs}`;
  console.log('[proxy]', targetUrl);
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        cookie: req.headers.cookie || '',
        'user-agent': req.headers['user-agent'] || '',
      },
    });
    const contentType = resp.headers.get('content-type') || 'application/json';
    res.status(resp.status).set('content-type', contentType);
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error('[proxy error]', e.message);
    res.status(502).json({ error: 'Proxy failed: ' + e.message });
  }
});

// Download proxy: SharePoint downloadUrl → binary 중계 (CORS 우회)
app.use(express.json());
app.post('/api/download-proxy', async (req, res) => {
  const { url } = req.body || {};
  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  // SharePoint URL만 허용
  if (!url.includes('sharepoint.com')) {
    return res.status(403).json({ error: 'Only SharePoint URLs allowed' });
  }
  console.log('[download-proxy]', url.substring(0, 120));
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Download failed: ' + resp.status });
    }
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    res.status(200).set('content-type', contentType);
    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error('[download-proxy error]', e.message);
    res.status(502).json({ error: 'Download proxy failed: ' + e.message });
  }
});

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MLB ACC Production v3 running on port ${PORT}`);
});
