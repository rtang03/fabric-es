require('dotenv').config();
import util from 'util';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from 'errorhandler';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import morgan from 'morgan';
import next from 'next';
import {
  getLogger,
  isLoginRequest,
  isLoginResponse,
  isRegisterRequest,
  isRegisterResponse,
  setPostRequest
} from '../utils';
import { createApiKeyRoute, createClientRoute, createProfileRoute } from './route';

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
    server.use(cors());
    server.use(express.json());
    server.use(cookieParser());
    server.use(express.urlencoded({ extended: false }));
    server.use(errorHandler());

    server.post('/web/api/login', async (req, res) => {
      if (!isLoginRequest(req.body)) {
        logger.warn('cannot register account: missing params - username, password');
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password' });
      }

      const { username, password } = req.body;

      try {
        const response = await fetch(`${ENV.AUTH_HOST}/account/login`, setPostRequest({ username, password }));
        const result: unknown = await response.json();

        if (isLoginResponse(result)) {
          // TODO: for real production should set { secure : true }
          res.cookie('token', result.access_token, { httpOnly: true, secure: false });

          return res.status(httpStatus.OK).send({ result });
        } else {
          logger.warn(util.format('fail to parse login response, %j', result));
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse login response' });
        }
      } catch (e) {
        logger.error(util.format('fail to login account, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to login account' });
      }
    });

    server.post('/web/api/register', async (req, res) => {
      const { username, email, password } = req.body;

      if (!isRegisterRequest(req.body)) {
        logger.warn('cannot register account: missing params - username, password, email');
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password, email' });
      }

      try {
        const response = await fetch(`${ENV.AUTH_HOST}/account/`, setPostRequest({ username, password, email }));
        const result: unknown = await response.json();
        if (isRegisterResponse(result)) {
          return res.status(httpStatus.OK).send({ result });
        } else {
          logger.warn(util.format('fail to parse register response, %j', result));
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse register response' });
        }
      } catch (e) {
        logger.error(util.format('fail to register account, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register account' });
      }
    });

    server.use('/web/api/profile', createProfileRoute({ authHost: ENV.AUTH_HOST as string }));

    server.use('/web/api/client', createClientRoute({ authHost: ENV.AUTH_HOST as string }));

    server.use('/web/api/api_key', createApiKeyRoute({authHost: ENV.AUTH_HOST as string}));

    server.get('/web/api/logout', (req, res) => {
      res.clearCookie('token');
      res.redirect('/web/login');
      res.status(httpStatus.OK).end();
    });

    server.get('/ping/auth', async (req, res) => {
      try {
        const status = await fetch(`${ENV.AUTH_HOST}/account/isalive`).then(r => r.status);
        return res.status(httpStatus.OK).send({ status });
      } catch (e) {
        logger.error(util.format('fail to ping %s/account/isalive, %j', ENV.AUTH_HOST, e));
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ error: util.format('fail to ping %s/account/isalive, %j', ENV.AUTH_HOST, e) });
      }
    });

    server.get('/islive', (_, res) => res.status(httpStatus.NO_CONTENT).end());

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
