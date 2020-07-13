require('dotenv').config();
import util from 'util';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from 'errorhandler';
import express from 'express';
import httpStatus from 'http-status';
import morgan from 'morgan';
import next from 'next';
import { getLogger } from '../utils';
import {
  createApiKeyRoute,
  createClientRoute,
  createGatewayRoute,
  createIndexRoute,
  createProfileRoute
} from './route';

const port = parseInt(process.env.PORT || '3000', 10);
const ENV = {
  NODE_ENV: process.env.NODE_ENV as string,
  AUTH_HOST: process.env.AUTH_HOST as string,
  GW_ORG_INTERNAL_HOST: process.env.GW_ORG_INTERNAL_HOST as string,
  GW_ORG_EXTERNAL_HOST: process.env.GW_ORG_EXTERNAL_HOST as string
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
    server.use('/web/api', createIndexRoute({ authHost: ENV.AUTH_HOST, gwOrgHost: ENV.GW_ORG_EXTERNAL_HOST }));
    server.use('/web/api/profile', createProfileRoute({ authHost: ENV.AUTH_HOST }));
    server.use('/web/api/client', createClientRoute({ authHost: ENV.AUTH_HOST }));
    server.use('/web/api/api_key', createApiKeyRoute({ authHost: ENV.AUTH_HOST }));
    server.use('/web/api/wallet', createGatewayRoute({ gwOrgHost: ENV.GW_ORG_INTERNAL_HOST }));

    server.get('/web/api/all_alive', async (req, res) => {
      try {
        const status = await fetch(`${ENV.AUTH_HOST}/account/isalive`).then(r => r.status);
        return res.status(httpStatus.OK).send({ [ENV.AUTH_HOST]: { status } });
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
