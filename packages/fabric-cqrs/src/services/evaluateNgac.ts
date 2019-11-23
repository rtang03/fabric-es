import { Network } from 'fabric-network';
import { getContract } from './contract';

export const evaluateNgac: <T = any>(
  fcn: string,
  args: string[],
  { network }: {network: Network}
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
          console.log(`Error processing Evaluate transaction: ${fcn}`);
          // console.error(error.stack);
          return { error };
        })
  );

export default evaluateNgac;
