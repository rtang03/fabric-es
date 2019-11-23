import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import { Commit } from '../types';
import { getContract } from './contract';

export const evaluate: (
  fcn: string,
  args: string[],
  { network }: { network: Network },
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
  { network }: { network: Network },
  privatedata?: boolean
) => Observable<Record<string, Commit>> = (fcn, args, options, privatedata) =>
  from(evaluate(fcn, args, options, privatedata));

export default evaluate$;
