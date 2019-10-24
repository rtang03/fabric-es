import { from, Observable } from 'rxjs';
import { Commit, Context } from '../types';
import { getContract } from './contract';

export const evaluate: (
  fcn: string,
  args: string[],
  { network }: Context,
  privatedata?: boolean
) => Promise<Record<string, Commit> | { error: any }> = async (
  fcn,
  args,
  { network },
  privatedata = false
) =>
  await getContract(network, privatedata).then(
    async ({ contract }) =>
      await contract
        .createTransaction(fcn)
        .evaluate(...args)
        .then<Record<string, Commit>>((res: any) =>
          JSON.parse(Buffer.from(JSON.parse(res)).toString())
        )
        .catch(error => {
          console.log(`Error processing Evaluate transaction: ${fcn}`);
          // console.error(error.stack);
          return { error };
        })
  );

export const evaluate$: (
  fcn: string,
  args: string[],
  context: Context,
  privatedata?: boolean
) => Observable<Record<string, Commit>> = (fcn, args, context, privatedata) =>
  from(evaluate(fcn, args, context, privatedata));

export default evaluate$;
