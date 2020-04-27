require('dotenv').config();
import util from 'util';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import morgan from 'morgan';
import next from 'next';
import { getLogger, isLoginResponse, isRegisterResponse, isUser, setPostRequest } from '../utils';

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

    server.post('/web/api/login', async (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
        logger.warn('cannot register account: missing params - username, password');
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password' });
      }

      try {
        const response = await fetch(`${ENV.AUTH_HOST}/account/login`, setPostRequest({ username, password }));
        const result: unknown = await response.json();
        if (isLoginResponse(result)) {
          res.cookie('jid', result.access_token, { httpOnly: true, secure: ENV.NODE_ENV === 'production' });
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

      if (!username || !email || !password) {
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

    server.get('/web/api/profile', async (req, res) => {
      const cookies = cookie.parse(req.headers.cookie ?? '');
      const token = cookies.jid;

      if (token === 'undefined') return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

      try {
        const response = await fetch(`${ENV.AUTH_HOST}/account/userinfo`, {
          headers: { authorization: `Bearer ${token}` }
        });
        const user: unknown = await response.json();

        if (response.status === httpStatus.OK && isUser(user)) {
          return res.status(httpStatus.OK).send(user);
        } else {
          logger.warn(util.format('fail to get userinfo: status, %s', response.status));
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get userinfo' });
        }
      } catch (e) {
        logger.error(util.format('fail to get userinfo, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get userinfo' });
      }
    });

    server.get('/web/api/logout', (req, res) => {
      res.clearCookie('jid');
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
