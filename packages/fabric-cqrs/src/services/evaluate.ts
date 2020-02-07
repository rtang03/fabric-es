import Client from 'fabric-client';
import { Network } from 'fabric-network';
import { from, Observable } from 'rxjs';
import util from 'util';
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
) => {
  const logger = Client.getLogger('evaluate.js');

  return getContract(network, privatedata).then(
    async ({ contract }) =>
      await contract
        .createTransaction(fcn)
        .evaluate(...args)
        .then<Record<string, Commit>>((res: any) => {
          const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());
          logger.info(util.format('successful response'));
          logger.debug(util.format('tx response: %j', result));
          return result;
        })
        .catch(error => {
          logger.error(util.format('error in %s: %j', fcn, error));
          return { error };
        })
  );
};

export const evaluate$: (
  fcn: string,
  args: string[],
  { network }: { network: Network },
  privatedata?: boolean
) => Observable<Record<string, Commit>> = (fcn, args, options, privatedata) =>
  from(evaluate(fcn, args, options, privatedata));

export default evaluate$;
