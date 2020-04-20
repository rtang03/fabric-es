import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import omit from 'lodash/omit';
import passport from 'passport';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createClientRoute.js' });

export const createClientRoute: () => express.Router = () => {
  const router = express.Router();

  router.post('/', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const application_name = req.body?.application_name;
    const client_secret = req.body?.client_secret;
    const redirect_uris = req.body?.redirect_uris || [];
    const grants = req.body?.grants || [];
    const is_system_app = req.body?.is_system_app ?? false;
    const user = req.user as User;
    const user_id = user.id;

    if (!application_name || !client_secret)
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'application_name, client_secret is required' });

    const client = Client.create({ application_name, client_secret, redirect_uris, grants, user_id, is_system_app });

    try {
      await Client.insert(client);
      return res.status(httpStatus.OK).send({ ok: true, application_name, id: client.id });
    } catch (e) {
      logger.error(util.format('fail to insert client %s, %j', client.id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register client' });
    }
  });

  // todo: pagination requires extra coding
  router.get('/', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const application_name = req.query.application_name;
    const user = req.user as User;

    if (application_name) {
      try {
        const client = await Client.findOne({ application_name, user_id: user.id });
        return res.status(httpStatus.OK).send(omit(client, 'client_secret'));
      } catch (e) {
        logger.error(util.format('fail to retrieve client, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to retrieve client' });
      }
    } else {
      try {
        const clients: Client[] = await Client.find({
          where: { user_id: user.id },
          order: { application_name: 'ASC' },
          skip: 0,
          take: 10
        });
        return res.status(httpStatus.OK).send(clients);
      } catch (e) {
        logger.error(util.format('fail to retrieve list of clients, %j', e));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to retrieve list of clients' });
      }
    }
  });

  router.get('/:client_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const client_id = req.params.client_id;
    const user = req.user as User;

    try {
      const client = await Client.findOne({ where: { id: client_id, user_id: user.id } });
      return res.status(httpStatus.OK).send(client);
    } catch (e) {
      logger.error(util.format('fail to retrieve client %s, %j', client_id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to retrieve client' });
    }
  });

  router.put('/:client_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const client_id = req.params.client_id;

    let client: Client;

    try {
      client = await Client.findOne({ where: { client_id } });
    } catch (e) {
      logger.error(util.format('fail to find client %s, %j', client_id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find client' });
    }

    if (!client) return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find client' });

    try {
      const payload = {
        application_name: req.body?.application_name || client.application_name,
        client_secret: req.body?.client_secret || client.client_secret,
        redirect_uris: req.body?.redirect_uris || client.redirect_uris,
        grants: req.body?.grants || client.grants
      };
      await Client.update(client_id, payload);
      return res.status(httpStatus.OK).send({ ok: true, ...payload });
    } catch (e) {
      logger.error(util.format('fail to update client %s, %j', client_id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update client' });
    }
  });

  router.delete('/:client_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const client_id = req.params.client_id;
    const user = req.user as User;

    try {
      await Client.delete(client_id);
      return res.status(httpStatus.OK).send({ ok: true });
    } catch (e) {
      logger.error(util.format('fail to delete client %s, %j', client_id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to delete client' });
    }
  });

  return router;
};
