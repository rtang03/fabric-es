import { from, Observable } from 'rxjs';
import { Commit, Context } from '../types';
import { getContract } from './contract';

export const submitPrivateData: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  { network }: Context
) => Promise<
  Record<string, Commit> & { error?: any; status?: string; message?: string }
> = async (fcn, args, transientData, { network }) =>
  await getContract(network, true).then(
    async ({ contract }) =>
      await contract
        .createTransaction(fcn)
        .setTransient(transientData)
        .submit(...args)
        .then<Record<string, Commit>>((res: any) =>
          JSON.parse(Buffer.from(JSON.parse(res)).toString())
        )
        .catch(error => {
          console.log(`Error processing SubmitPrivateData. ${error}`);
          console.error(error.stack);
          return { error };
        })
  );

export const submitPrivateData$: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  context: Context
) => Observable<
  Record<string, Commit> | { error?: any; status?: string; message?: string }
> = (fcn, args, transientData, context) =>
  from(submitPrivateData(fcn, args, transientData, context));
