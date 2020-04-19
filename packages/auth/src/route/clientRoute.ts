import express from 'express';
import httpStatus from 'http-status';
import { Client } from '../entity/Client';
import { getLogger } from '../utils/getLogger';

const logger = getLogger({ name: '[auth] clientRoute.js' });
const clientRoute = express.Router();

clientRoute.post('/', async (req, res) => {
  const application_name = req.body?.application_name;
  const client_secret = req.body?.client_secret;
  const redirect_uris = req.body?.redirect_uris || [];
  const grants = req.body?.grants || [];
  const user_id = req.body?.user_id;
  const is_system_app = req.body?.is_system_app ?? false;

  if (!application_name || !client_secret)
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'application_name, client_secret is required' });

  try {
    const client = Client.create({ application_name, client_secret, redirect_uris, grants, user_id, is_system_app });
    await Client.insert(client);
    return res.status(httpStatus.OK).send({ application_name, id: client.id });
  } catch (e) {
    console.error(e);
    res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register client' });
  }
});

export { clientRoute };
