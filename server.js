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

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MLB ACC Production v3 running on port ${PORT}`);
});
