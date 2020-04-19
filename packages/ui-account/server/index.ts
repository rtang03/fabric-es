require('dotenv').config({ path: './.env.dev' });
import express from 'express';
import next from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    server.get('/account/callback', async (req, res) => {
      res.status(200).send('ok, i am good');
    });

    server.get('*', (req, res) => handle(req, res));

    server.listen(port, error => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      console.log(`🚀 Server listening at http://localhost:${port}`);
    });
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
