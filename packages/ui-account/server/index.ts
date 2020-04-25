require('dotenv').config();
import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import morgan from 'morgan';
import next from 'next';
import { getLogger } from './getLogger';
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const logger = getLogger({ name: '[ui-account] index.js' });

app
  .prepare()
  .then(() => {
    const server = express();

    server.use(morgan('dev'));

    server.get('/web/callback', (req, res) => {
      res.status(200).send('ok, i am good');
    });

    server.post('/web/api/register', async (req, res) => {
      let register;
      try {
        register = await fetch(`${process.env.AUTH_HOST}/isalive`).then(res => {
          res.status;
          res.json();
        });
      } catch (e) {
        return res.status(httpStatus.OK);
      }
      res.status(httpStatus.OK).send({ result: 'ok' });
    });

    server.get('/ping/auth', async (req, res) => {
      let status;

      try {
        status = await fetch(`${process.env.AUTH_HOST}/account/isalive`).then(res => res.status);
      } catch (e) {
        logger.error(util.format('fail to ping %s/account/isalive, %j', process.env.AUTH_HOST, e));
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ error: util.format('fail to ping %s/account/isalive, %j', process.env.AUTH_HOST, e) });
      }
      return res.status(httpStatus.OK).send({ status });
    });

    server.get('/islive', (_, res) => res.status(httpStatus.NO_CONTENT));

    server.get('*', (req, res) => handle(req, res));

    server.listen(port, error => {
      if (error) {
        logger.error(util.format('fail to start proxy server, %j', error));
        process.exit(1);
      }
      console.log(`🚀 Server listening at http://localhost:${port}`);
      logger.info(`🚀 Server listening at http://localhost:${port}`);
    });
  })
  .catch(e => {
    logger.error(util.format('fail to start proxy server, %j', e));
    process.exit(1);
  });
