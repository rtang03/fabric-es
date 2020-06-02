import util from 'util';
import { Utils } from 'fabric-common';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import { createCommitId } from '../../peer/utils';
import type { Commit } from '../../types';
import { getContract } from './contract';

/**
 * **submit** submit transaction to eventstore chaincode
 * @param fcn function
 * @param args args
 * @param network `{ network: Network }`
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
  const logger = Utils.getLogger('[fabric-cqrs] submit.js');

  const input_args = fcn === 'eventstore:createCommit' ? [...args, createCommitId()] : args;

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...input_args)
      .then<Record<string, Commit>>((res: any) => {
        const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());
        logger.info(util.format('%s successful response', fcn));
        return result;
      })
      .catch((error) => {
        logger.error(util.format('error in %s: %j', fcn, error));
        return { error };
      })
  );
};

export const submit$: (
  fcn: string,
  args: string[],
  options: { network: Network }
) => Observable<Record<string, Commit> | { error?: any; status?: string; message?: string }> = (
  fcn,
  args,
  options
) => from(submit(fcn, args, options));
