import util from 'util';
import { Response, Request } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const catchErrors: (
  fcn: (req: Request, res: Response) => Promise<any>,
  option: {
    logger: Logger;
    fcnName: string;
  }
) => (req: Request, res: Response) => void = (fcn, { fcnName, logger }) => async (req, res) => {
  try {
    await fcn(req, res);
  } catch (e) {
    logger.error(util.format('fail to %s, %j', fcnName, e));
    res.status(httpStatus.BAD_REQUEST).send(e);
  }
};
