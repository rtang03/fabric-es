import util from 'util';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import type { Commit } from '../types';
import { createCommitId, getLogger } from '../utils';
import { getContract } from './contract';

/**
 * @about submit transaction to eventstore chaincode
 * @params fcn function
 * @params args args
 * @params network `{ network: Network }`
 * @returns `Record<string, Commit> & { error?: any; status?: string; message?: string }`
 */
export const submit: (
  fcn: string,
  args: string[],
  options: { network: Network }
) => Promise<Record<string, Commit> & { error?: any; status?: string; message?: string }> = async (
  fcn,
  args,
  { network }
) => {
  const logger = getLogger({ name: '[fabric-cqrs] submit.js' });

  const isNullArg = args.reduce((prev, curr) => prev || curr === undefined || curr === null, false);

  if (isNullArg) return { error: 'invalid input argument' };

  let input_args = args;

  if (fcn === 'eventstore:createCommit') {
    input_args = [...args.slice(0, 4), createCommitId()];
    // signedRequest
    if (args[4]) input_args.push(args[4]);
    else input_args.push('');
  }

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...input_args)
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
export const submit$: (
  fcn: string,
  args: string[],
  options: { network: Network }
) => Observable<Record<string, Commit> | { error?: any; status?: string; message?: string }> = (
  fcn,
  args,
  options
) => from(submit(fcn, args, options));
