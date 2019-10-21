import { Context } from '../types';
import { getContract } from './contract';

export const submitNgac: <T = any>(
  fcn: string,
  args: string[],
  { network }: Context
) => Promise<T | { error?: any; status?: string; message?: string }> = async <
  T = any
>(
  fcn,
  args,
  { network }
) =>
  await getContract(network).then(({ contract }) =>
    contract
      .createTransaction(fcn)
      .submit(...args)
      .then<T>((res: any) =>
        JSON.parse(Buffer.from(JSON.parse(res)).toString())
      )
      .catch(error => {
        console.log(`Error processing Submit transaction.`);
        console.error(error.stack);
        console.log(fcn);
        return { error };
      })
  );

export default submitNgac;
