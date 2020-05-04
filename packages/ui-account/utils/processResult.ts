import util from 'util';
import { Response } from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import { Logger } from 'winston';

export const processResult: (option: {
  response: fetch.IsomorphicResponse;
  res: Response;
  fcnName: string;
  logger: Logger;
  typeGuard?: any;
}) => Promise<Response> = async ({ res, response, fcnName, logger, typeGuard }) => {
  const status = response.status;

  if (status === httpStatus.UNAUTHORIZED) {
    logger.warn(`fail to authorize, fcn: ${fcnName}`);
    res.clearCookie('token');
    return res.status(httpStatus.UNAUTHORIZED).send({ error: 'fail to authorize' });
  }

  let result;

  try {
    result = await response.json();
  } catch (e) {
    logger.error(util.format('fail to parse response, %j'));
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse response' });
  }

  if (typeGuard && !typeGuard(result)) {
    logger.warn(util.format('fail to %s: unexpected format, %j', fcnName, result));
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'unexpected format' });
  }

  if (status === httpStatus.OK) {
    logger.info(`perform ${fcnName} successfully`);
    return res.status(httpStatus.OK).send(result);
  } else {
    logger.warn(`fail to ${fcnName}, status: ${status}`);
    return res.status(httpStatus.BAD_REQUEST).send({ error: `fail to ${fcnName}` });
  }
};
