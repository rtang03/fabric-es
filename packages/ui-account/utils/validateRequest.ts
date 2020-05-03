import { Response } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const validateRequest: (
  request: unknown,
  option: { res: Response; typeGuard: any; logger: Logger; fcnName: string }
) => any = (request, { res, typeGuard, logger, fcnName }) => {
  if (!typeGuard(request)) {
    logger.warn(`fail to ${fcnName}: invalidated request`);
    return res.status(httpStatus.BAD_REQUEST);
  }
};
