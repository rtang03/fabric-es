import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { CreateClientRequest, CreateClientResponse, UpdateClientRequest } from '../types';
import { catchErrors, getLogger, isCreateClientRequest, isUpdateClientRequest } from '../utils';

const logger = getLogger({ name: '[auth] createClientRoute.js' });

export const createClientRoute: () => express.Router = () => {
  const router = express.Router();

  router.get(
    '/:client_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { client_id } = req.params;
        const user = req.user as User;
        const error = 'fail to retrieve client';
        const client = await Client.findOne({ where: { id: client_id, user_id: user.id } });

        if (client) {
          logger.info(`account ${user.id} retrieves client ${client_id}`);

          return res.status(httpStatus.OK).send(client);
        } else {
          logger.warn(`${error}: no client returned`);

          return res.status(httpStatus.BAD_REQUEST).send({ error });
        }
      },
      { logger, fcnName: 'retrieve client' }
    )
  );

  router.put(
    '/:client_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { client_id } = req.params;
        const user = req.user as User;
        const error = 'fail to update client';
        const request: UpdateClientRequest = {
          application_name: req.body?.application_name,
          client_secret: req.body?.client_secret,
          redirect_uris: req.body?.redirect_uris,
          grants: req.body?.grants
        };

        if (!isUpdateClientRequest(request)) {
          logger.warn(`${error} ${client_id}: missing params`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: `${error}: missing params` });
        } else {
          const client = await Client.findOne({ where: { id: client_id, user_id: user.id } });

          if (!client) {
            logger.warn(`${error} ${client_id}: fail to find client`);
            return res.status(httpStatus.NOT_FOUND).end();
          } else {
            const payload = {
              application_name: request.application_name ?? client.application_name,
              client_secret: request.client_secret ?? client.client_secret,
              redirect_uris: request.redirect_uris ?? client.redirect_uris,
              grants: request.grants ?? client.grants
            };

            await Client.update(client_id, payload);

            logger.info(`account ${user.id} updates client ${client_id}`);

            return res.status(httpStatus.OK).send({ ok: true, ...payload });
          }
        }
      },
      { logger, fcnName: 'update client' }
    )
  );

  router.delete(
    '/:client_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { client_id } = req.params;
        const user = req.user as User;
        const error = 'fail to delete client';
        const client = await Client.findOne({ where: { id: client_id, user_id: user.id } });

        if (!client) {
          logger.warn(`${error} ${client_id}: fail to find client`);

          return res.status(httpStatus.NOT_FOUND).end();
        } else {
          await Client.delete(client_id);

          logger.info(`account ${user.id} deletes client ${client_id}`);

          return res.status(httpStatus.OK).send({ ok: true });
        }
      },
      { logger, fcnName: 'delete client' }
    )
  );

  // todo: pagination requires extra coding
  router.get(
    '/',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { application_name } = req.query;
        const user = req.user as User;

        if (application_name) {
          const client = await Client.findOne({ application_name, user_id: user.id });

          if (client) {
            logger.info(`account ${user.id} retrieves client record ${client.id}`);
            return res.status(httpStatus.OK).send(client);
          } else {
            logger.warn(`${application_name} not found`);
            return res.status(httpStatus.NOT_FOUND).end();
          }
        } else {
          const clients: Client[] = await Client.find({
            where: { user_id: user.id },
            order: { application_name: 'ASC' },
            skip: 0,
            take: 10
          });

          if (clients?.length) {
            logger.info(`account ${user.id} retrieves ${clients.length} client records`);
            return res.status(httpStatus.OK).send(clients);
          } else {
            logger.warn(`no clients`);
            return res.status(httpStatus.NOT_FOUND).end();
          }
        }
      },
      { logger, fcnName: 'retrieve client(s)' }
    )
  );

  router.post(
    '/',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const { application_name, client_secret, redirect_uris } = req.body;
        const user = req.user as User;
        const user_id = user.id;
        const request: CreateClientRequest = {
          application_name,
          client_secret,
          redirect_uris,
          user_id,
          grants: req.body?.grants || ['password', 'client_credentials'],
          is_system_app: req.body?.is_system_app ?? false
        };

        if (!isCreateClientRequest(request)) {
          logger.warn(`cannot create client: missing params`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params' });
        }

        const client = Client.create(request);

        await Client.insert(client);

        logger.info(`account ${user_id} register new client ${client.id}`);

        return res.status(httpStatus.OK).send({ ok: true, application_name, id: client.id } as CreateClientResponse);
      },
      { logger, fcnName: 'register client' }
    )
  );

  return router;
};
