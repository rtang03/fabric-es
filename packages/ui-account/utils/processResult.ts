import { Response } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const processResult: (option: {
  status: number;
  result: any;
  res: Response;
  error: string;
  logger: Logger;
}) => Response = ({ status, res, result, error, logger }) => {
  if (status === httpStatus.OK) {
    return res.status(httpStatus.OK).send(result);
  }

  if (status === httpStatus.UNAUTHORIZED) {
    res.clearCookie('token');
    return res.status(httpStatus.UNAUTHORIZED);
  }

  logger.warn(`${error}, status: ${status}`);
  return res.status(httpStatus.BAD_REQUEST).send({ error });
};
