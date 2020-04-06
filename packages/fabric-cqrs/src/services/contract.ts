import { Contract, Network } from 'fabric-network';

/**
 * **getContract** return contract instance of fabric-sdk
 * @param network network instance of fabric-sdk
 * @returns `{ contract: Contract }`
 */
export const getContract: (network: Network) => Promise<{ contract: Contract }> = async network => ({
  contract: network.getContract('eventstore')
});
