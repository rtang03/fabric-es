import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { ApiKey } from '../entity/ApiKey';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createApiKeyRoute.js' });

export const createApiKeyRoute: () => express.Router = () => {
  const router = express.Router();

  router.get('/', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const { client_id } = req.query;
    const user = req.user as User;

    try {
      const client = await Client.findOne(client_id);

      if (!client) {
        logger.warn(`cannot get api_key by ${client_id}: fail to find client`);
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'no such client' });
      }

      if (client.user_id !== user.id) {
        logger.warn(`cannot get api_key by ${client_id}: user_id mis-match`);
        return res.status(httpStatus.UNAUTHORIZED).send({ error: 'user_id mis-match' });
      }
    } catch (e) {
      logger.warn(`cannot get api_key by ${client_id}: fail to find client`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find client' });
    }

    try {
      const apiKeys = await ApiKey.find({ where: { client_id } });

      return res.status(httpStatus.OK).send({ ok: true, apiKeys: apiKeys || [] });
    } catch (e) {
      logger.error(util.format('fail to get api_key %s, %j', client_id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get api_key' });
    }
  });

  return router;
};
