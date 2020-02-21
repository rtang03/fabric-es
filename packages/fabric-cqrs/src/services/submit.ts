import Client from 'fabric-client';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import util from 'util';
import { createCommitId } from '../peer/utils';
import { Commit } from '../types';
import { getContract } from './contract';

export const submit: (
  fcn: string,
  args: string[],
  { network }: { network: Network }
) => Promise<
  Record<string, Commit> & { error?: any; status?: string; message?: string }
> = async (fcn, args, { network }) => {
  const logger = Client.getLogger('submit.js');

  const input_args =
    fcn === 'createCommit' ? [...args, createCommitId()] : args;

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...input_args)
      .then<Record<string, Commit>>((res: any) => {
        const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());
        logger.info(util.format('%s successful response', fcn));
        return result;
      })
      .catch(error => {
        logger.error(util.format('error in %s: %j', fcn, error));
        return { error };
      })
  );
};

export const submit$: (
  fcn: string,
  args: string[],
  { network }: { network: Network }
) => Observable<
  Record<string, Commit> | { error?: any; status?: string; message?: string }
> = (fcn, args, options) => from(submit(fcn, args, options));
