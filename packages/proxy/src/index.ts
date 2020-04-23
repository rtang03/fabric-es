require('dotenv').config();
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'));
app.get('/isalive', (req, res) => res.sendStatus(204));
app.use('/web', createProxyMiddleware({ target: process.env.APP_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/account', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/oauth', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/api', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/client', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));

app.listen(parseInt(process.env.PORT, 10), process.env.HOST, () => {
  console.log(`Proxy running at ${process.env.HOST}:${process.env.PORT}`);
});
