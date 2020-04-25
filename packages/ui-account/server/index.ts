import { setPostRequest } from '../components';

require('dotenv').config();
import util from 'util';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import morgan from 'morgan';
import next from 'next';
import { getLogger } from './getLogger';

const port = parseInt(process.env.PORT || '3000', 10);
const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  AUTH_HOST: process.env.AUTH_HOST
};

const dev = ENV.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const logger = getLogger({ name: '[ui-account] index.js' });

app
  .prepare()
  .then(() => {
    Object.entries(ENV).forEach(([key, value]) => {
      if (value === undefined) {
        logger.error(`environment variable is missing ${key}`);
        throw new Error(`environment variable is missing ${key}`);
      }
    });

    const server = express();
    server.use(morgan('dev'));
    server.use(express.json());
    server.use(cookieParser());
    server.use(express.urlencoded({ extended: false }));
    server.use(errorHandler());

    server.get('/web/callback', (_, res) => res.status(200).send('i am good'));

    server.post('/web/api/login', async (req, res) => {
      const { username, password } = req.body;

      let result;

      if (!username || !password) {
        logger.warn('cannot register account: missing params - username, password');
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password' });
      }

      try {
        result = await fetch(`${ENV.AUTH_HOST}/account/login`, setPostRequest({ username, password })).then(r =>
          r.json()
        );
      } catch (e) {
        logger.error(util.format('fail to login account, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to login account' });
      }
      res.cookie('jid', result?.assess_token, { httpOnly: true, secure: ENV.NODE_ENV === 'production' });
      res.status(httpStatus.OK).send({ result });
    });

    server.post('/web/api/register', async (req, res) => {
      const { username, email, password } = req.body;

      let result;

      if (!username || !email || !password) {
        logger.warn('cannot register account: missing params - username, password, email');
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password, email' });
      }

      try {
        result = await fetch(`${ENV.AUTH_HOST}/account/`, setPostRequest({ username, password, email })).then(r =>
          r.json()
        );
      } catch (e) {
        logger.error(util.format('fail to register account, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register account' });
      }
      res.status(httpStatus.OK).send({ result });
    });

    server.get('/web/api/profile', async (req, res) => {});

    server.get('/ping/auth', async (req, res) => {
      let status;

      try {
        status = await fetch(`${ENV.AUTH_HOST}/account/isalive`).then(r => r.status);
      } catch (e) {
        logger.error(util.format('fail to ping %s/account/isalive, %j', ENV.AUTH_HOST, e));
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ error: util.format('fail to ping %s/account/isalive, %j', ENV.AUTH_HOST, e) });
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
