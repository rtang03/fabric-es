import * as Client from 'fabric-client';
import { from, Observable } from 'rxjs';
import { Commit, Context } from '../types';
import { getContract } from './contract';

const logger = Client.getLogger('SUBMIT');

export const submit: (
  fcn: string,
  args: string[],
  { network }: Context
) => Promise<
  Record<string, Commit> & { error?: any; status?: string; message?: string }
> = async (fcn, args, { network }) =>
  await getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...args)
      .then<Record<string, Commit>>((res: any) =>
        JSON.parse(Buffer.from(JSON.parse(res)).toString())
      )
      .catch(error => {
        logger.info(`Error processing Submit transaction: ${fcn}`);
        logger.error(error.stack);
        return { error };
      })
  );

export const submit$: (
  fcn: string,
  args: string[],
  context: Context
) => Observable<
  Record<string, Commit> | { error?: any; status?: string; message?: string }
> = (fcn, args, context) => from(submit(fcn, args, context));
