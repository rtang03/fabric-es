import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.test') });

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import express from 'express';
import fetch from 'isomorphic-unfetch';
import next from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use([
    bodyParser.urlencoded({ extended: true }),
    cookieParser('secret'),
    csrf({ cookie: true })
  ]);

  server.get('/oauth_server_uri', (_, res) =>
    res.status(200).send(process.env.OAUTH_SERVER_URI || '')
  );

  server.get('/auth_uri', (_, res) =>
    res.status(200).send(process.env.AUTHORIZATION_URI || '')
  );
  server.get('/callback', async (req, res) => {
    const grant_type = 'authorization_code';
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const redirect_uri = process.env.REDIRECT_URI;
    const code = req.query.code;
    const body = `client_id=${client_id}&grant_type=${grant_type}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`;
    // Todo: should change to 3300 port
    await fetch(process.env.TOKEN_URI || 'http://localhost:4000/oauth/token', {
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
      .then(response => response.json())
      .then(data => {
        if (data?.ok) {
          res.cookie('jid', data.token.accessToken, {
            maxAge: 900000,
            httpOnly: true
          });
        }
        return res.redirect('/');
      })
      .catch(error => {
        res.clearCookie('jid');
        console.log(error);
      });
  });

  server.get('/network', async (_, res) => {
    const peers = require('./network.json');
    res.status(200).send(peers);
  });

  server.get('*', (req, res) => handle(req, res));

  server.listen(port, err => {
    if (err) throw err;
    console.log(
      `🚀 Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
  });
});
