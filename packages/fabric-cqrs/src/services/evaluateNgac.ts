import { Context } from '../types';
import { getContract } from './contract';

export const evaluateNgac: <T = any>(
  fcn: string,
  args: string[],
  { network }: Context
) => Promise<T | { error: any }> = async <T = any>(fcn, args, { network }) =>
  await getContract(network).then(
    async ({ contract }) =>
      await contract
        .createTransaction(fcn)
        .evaluate(...args)
        .then<T>((res: any) =>
          JSON.parse(Buffer.from(JSON.parse(res)).toString())
        )
        .catch(error => {
          console.log(`Error processing Evaluate transaction`);
          console.error(error.stack);
          return { error };
        })
  );

export default evaluateNgac;
