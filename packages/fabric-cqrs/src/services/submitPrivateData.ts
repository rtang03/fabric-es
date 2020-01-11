import Client from 'fabric-client';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import util from 'util';
import { createCommitId } from '../peer/utils';
import { Commit } from '../types';
import { getContract } from './contract';

export const submitPrivateData: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  { network }: { network: Network }
) => Promise<
  Record<string, Commit> & { error?: any; status?: string; message?: string }
> = async (fcn, args, transientData, { network }) => {
  const logger = Client.getLogger('Submit privatedata tx');
  const input_args =
    fcn === 'privatedata:createCommit' ? [...args, createCommitId()] : args;

  return getContract(network, true).then(
    async ({ contract }) =>
      await contract
        .createTransaction(fcn)
        .setTransient(transientData)
        .submit(...input_args)
        .then<Record<string, Commit>>((res: any) => {
          const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());
          logger.info(util.format('tx response: %j', result));
          return result;
        })
        .catch(error => {
          logger.error(util.format('error in %s: %j', fcn, error));
          return { error };
        })
  );
};

export const submitPrivateData$: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  { network }: { network: Network }
) => Observable<
  Record<string, Commit> | { error?: any; status?: string; message?: string }
> = (fcn, args, transientData, options) =>
  from(submitPrivateData(fcn, args, transientData, options));
