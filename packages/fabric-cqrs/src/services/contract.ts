import { Contract, Network } from 'fabric-network';
import '../env';

export const getContract: (
  network: Network,
  privatedata?: boolean
) => Promise<{ contract: Contract }> = async (
  network,
  privatedata = false
) => ({
  contract: await network.getContract(
    privatedata
      ? process.env.CHAINCODE_ID_PRIVATEDATA || 'privatedata'
      : process.env.CHAINCODE_ID || 'eventstore'
  )
});
