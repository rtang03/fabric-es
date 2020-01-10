import * as Client from 'fabric-client';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import { createCommitId } from '../peer/utils';
import { Commit } from '../types';
import { getContract } from './contract';

const logger = Client.getLogger('SUBMIT');

export const submit: (
  fcn: string,
  args: string[],
  { network }: { network: Network }
) => Promise<
  Record<string, Commit> & { error?: any; status?: string; message?: string }
> = async (fcn, args, { network }) => {
  const input_args =
    fcn === 'createCommit' ? [...args, createCommitId()] : args;

  return getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...input_args)
      .then<Record<string, Commit>>((res: any) =>
        JSON.parse(Buffer.from(JSON.parse(res)).toString())
      )
      .catch(error => {
        logger.info(`Error processing Submit transaction: ${fcn}`);
        logger.error(error.stack);
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
