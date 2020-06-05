import util from 'util';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import type { Commit } from '../../types';
import { createCommitId } from '../createCommitId';
import { getLogger } from '../getLogger';
import { getContract } from './contract';

/**
 * **submitPrivateData** submit transaction to privatedata chaincode
 * @param fcn function
 * @param args args
 * @param transientData transient data
 * @param network network
 */
export const submitPrivateData: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  options: { network: Network }
) => Promise<Record<string, Commit> & { error?: any; status?: string; message?: string }> = async (
  fcn,
  args,
  transientData,
  { network }
) => {
  const logger = getLogger({ name: '[fabric-cqrs] submitPrivateData.js' });

  const isNullArg = args.reduce((prev, curr) => prev && !!curr, true);

  if (!isNullArg) return { error: 'invalid input argument' };

  const input_args = fcn === 'privatedata:createCommit' ? [...args, createCommitId()] : args;

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .setTransient(transientData)
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

export const submitPrivateData$: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  options: { network: Network }
) => Observable<Record<string, Commit> | { error?: any; status?: string; message?: string }> = (
  fcn,
  args,
  transientData,
  options
) => from(submitPrivateData(fcn, args, transientData, options));
