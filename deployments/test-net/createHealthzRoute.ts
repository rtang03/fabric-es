import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import { TokenRepo } from '../entity/AccessToken';
import { User } from '../entity/User';
import { getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createHealthzRoute.js' });

export const createHealthzRoute: (option: { tokenRepo: TokenRepo }) => express.Router = ({
  tokenRepo,
}) => {
  const router = express.Router();

  router.get('/', async (_, res) => {
    const response: any = {
      uptime: process.uptime(),
      timestamp: Date.now().toLocaleString(),
    };

    try {
      const prober = await User.findOne({ where: { username: 'prober' } });
      if (prober.username === 'prober') response.psql = 'ok';
    } catch (err) {
      logger.warn(util.format('healthz error: %j', err));
      response.psql = err;
      return res.status(503).send();
    }

    return res.status(httpStatus.OK).send(response);
  });

  return router;
};
