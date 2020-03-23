import { Contract, Network } from 'fabric-network';

/**
 * **getContract** return contract instance of fabric-sdk
 * @param network network instance of fabric-sdk
 * @param privatedata boolean - is private data
 * @returns `{ network: Network }`
 */
export const getContract: (network: Network, privatedata?: boolean) => Promise<{ contract: Contract }> = async (
  network,
  privatedata = false
) => ({
  contract: network.getContract(
    privatedata ? process.env.CHAINCODE_ID_PRIVATEDATA || 'privatedata' : process.env.CHAINCODE_ID || 'eventstore'
  )
});
