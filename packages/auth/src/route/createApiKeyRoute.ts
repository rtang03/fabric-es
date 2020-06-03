import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { ApiKey } from '../entity/ApiKey';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { catchErrors, getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createApiKeyRoute.js' });

export const createApiKeyRoute: () => express.Router = () => {
  const router = express.Router();

  router.get('/isalive', (_, res) => res.sendStatus(httpStatus.NO_CONTENT));

  router.get(
    '/',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { client_id } = req.query;
        const user = req.user as User;
        const message = 'get api_key';

        const client = await Client.findOne({ where: { id: client_id } });

        if (!client) {
          logger.warn(`fail to ${message} by ${client_id}: fail to find client`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'no such client' });
        } else if (client.user_id !== user.id) {
          logger.warn(`fail to ${message} by ${client_id}: user_id mis-match`);
          return res.status(httpStatus.UNAUTHORIZED).send({ error: 'user_id mis-match' });
        } else {
          const keys = await ApiKey.find({ where: { client_id } });

          return res.status(httpStatus.OK).send(keys);
        }
      },
      { logger, fcnName: 'get api_key' }
    )
  );

  router.delete(
    '/:api_key',
    catchErrors(
      async (req, res) => {
        const id = req.params.api_key;
        const error = 'fail to delete api_key';

        if (id) {
          await ApiKey.delete(id);
          return res.status(httpStatus.OK).send({ ok: true });
        } else {
          logger.warn(`${error}: missing api_key`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: `${error}: missing api_key` });
        }
      },
      { logger, fcnName: 'delete api_key' }
    )
  );

  return router;
};
