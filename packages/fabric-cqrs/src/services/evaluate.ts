import util from 'util';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import type { Commit } from '../types';
import { getLogger } from '../utils';
import { getContract } from './contract';

/**
 * @about evaluate transaction
 * @params fcn function
 * @params args args
 * @params network network `{ network: Network }`
 * @returns `Record<string, Commit> | { error: any }`
 */
export const evaluate: (
  fcn: string,
  args: string[],
  options: { network: Network }
) => Promise<Record<string, Commit> | { error: any }> = async (fcn, args, { network }) => {
  const logger = getLogger({ name: '[fabric-cqrs] evaluate.js' });

  const isNullArg = args.reduce((prev, curr) => prev && !!curr, true);

  if (!isNullArg) return { error: 'invalid input argument' };

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .evaluate(...args)
      .then<Record<string, Commit>>((res: any) => {
        const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());
        logger.debug(util.format('%s successful response', fcn));
        return result;
      })
      .catch((error) => {
        logger.error(util.format('error in %s: %j', fcn, error));
        return { error };
      })
  );
};

/**
 * @about observables
 * @params fcn
 * @params args
 * @params options
 */
export const evaluate$: (
  fcn: string,
  args: string[],
  options: { network: Network }
) => Observable<Record<string, Commit>> = (fcn, args, options) =>
  from(evaluate(fcn, args, options));

export default evaluate$;
