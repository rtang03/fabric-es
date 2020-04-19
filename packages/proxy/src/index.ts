require('dotenv').config();
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.get('/isalive', (req, res) => res.sendStatus(204));
// app.use('/account', createProxyMiddleware({ target: process.env.APP_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/auth', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));

app.listen(parseInt(process.env.PORT, 10), process.env.HOST, () => {
  console.log(`Proxy running at ${process.env.HOST}:${process.env.PORT}`);
});

console.log('[Reverse Proxy] Server: listening on port 8080');
console.log('[Reverse Proxy] Opening: http://localhost:8080/api');
