import util from 'util';
import { Logger } from 'winston';
import { QueryHandlerResponse } from '../types';

export const catchErrors: <TResult = any>(
  fcn: Promise<any>,
  option: { fcnName: string; logger: Logger }
) => Promise<QueryHandlerResponse<TResult>> = async (fcn, { fcnName, logger }) => {
  try {
    const { result, message } = await fcn;
    return {
      status: 'OK',
      data: result,
      message,
    };
  } catch (e) {
    logger.error(util.format('fail to %s, %j', fcnName, e));
    return {
      status: 'ERROR',
      data: null,
      error: e,
    };
  }
};
