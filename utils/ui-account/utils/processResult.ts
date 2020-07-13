import util from 'util';
import { Response } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'winston';

export const processResult: (option: {
  response: any;
  res: Response;
  fcnName: string;
  logger: Logger;
  typeGuard?: any;
  isGql?: boolean;
}) => Promise<Response> = async ({ res, response, fcnName, logger, typeGuard, isGql = false }) => {
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
    logger.error(util.format('fail to parse response, %j', e));
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse response' });
  }

  if (isGql) {
    if (result?.errors) {
      logger.warn(util.format('fail to %s: graphql errors: %j', fcnName, result.errors));
      return res.status(httpStatus.BAD_REQUEST).send({ errors: result.errors });
    }
  }

  if (typeGuard && !typeGuard(result)) {
    logger.warn(util.format('fail to %s: unexpected format, %j', fcnName, result));
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'unexpected format' });
  }

  if (status === httpStatus.OK) {
    logger.info(`${fcnName} successfully`);
    return res.status(httpStatus.OK).send(result);
  } else {
    logger.warn(`fail to ${fcnName}, status: ${status}`);
    return res.status(httpStatus.BAD_REQUEST).send({ error: `fail to ${fcnName}` });
  }
};
