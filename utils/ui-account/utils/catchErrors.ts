import util from 'util';
import { Response, Request } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';
import { deserializeToken } from './deserializeToken';

export const catchErrors: (
  fcn: (req: Request, res: Response, fcnName: string, token?: string) => Promise<any>,
  option: {
    logger: Logger;
    fcnName: string;
    useToken?: boolean;
  }
) => (req: Request, res: Response) => void = (fcn, { fcnName, logger, useToken }) => async (req, res) => {
  try {
    if (useToken) {
      const token = deserializeToken(req);

      if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

      await fcn(req, res, fcnName, token);
    } else {
      await fcn(req, res, fcnName);
    }
  } catch (e) {
    logger.error(util.format('fail to %s, %j', fcnName, e));
    res.status(httpStatus.BAD_REQUEST).send(e);
  }
};
