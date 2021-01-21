import util from 'util';
import type { Logger } from 'winston';
import type { HandlerResponse } from '../types';

/**
 * High order function for try / catch
 * @ignore
 * @param fcn
 * @param fcnName
 * @param logger
 */
export const catchErrors: <TResult = any>(
  fcn: Promise<any>,
  option: { fcnName: string; logger: Logger }
) => Promise<HandlerResponse<TResult>> = async (fcn, { fcnName, logger }) => {
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
