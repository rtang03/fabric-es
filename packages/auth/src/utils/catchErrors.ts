import util from 'util';
import { Response, Request } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const catchErrors = (fn, logger: Logger) => async (req: Request, res: Response) => {
  try {
    await fn(req, res);
  } catch (e) {
    logger.error(util.format('%j', e));
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
  }
};
