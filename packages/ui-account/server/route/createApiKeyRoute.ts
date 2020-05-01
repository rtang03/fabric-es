import express from 'express';
import { getLogger } from '../../utils';

const logger = getLogger({ name: '[ui-account] createApiKeyRoute.js' });

export const createApiKeyRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();
  router.get('/', async (req, res) => {});

  router.post('/api_key', async (req, res) => {});

  router.delete('/api_key/:key', async (req, res) => {});

  router.post('/allow_access', async (req, res) => {});

  return router;
};
