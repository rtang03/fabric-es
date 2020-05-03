import { Response } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const processResult: (option: {
  status: number;
  result: any;
  res: Response;
  fcnName: string;
  logger: Logger;
  typeGuard?: any;
}) => Response = ({ status, res, result, fcnName, logger, typeGuard }) => {
  if (!typeGuard?.(result)) {
    logger.warn(`fail to ${fcnName}: unexpected format`);
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'unexpected format' });
  }

  if (status === httpStatus.OK) {
    logger.info(`$perform {fcnName} successfully`);
    return res.status(httpStatus.OK).send(result);
  } else if (status === httpStatus.UNAUTHORIZED) {
    res.clearCookie('token');
    return res.status(httpStatus.UNAUTHORIZED);
  } else {
    logger.warn(`fail to ${fcnName}, status: ${status}`);
    return res.status(httpStatus.BAD_REQUEST).send({ error: `fail to ${fcnName}` });
  }
};
