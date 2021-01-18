import { Contract, Network } from 'fabric-network';

/**
 * Return contract instance of fabric-sdk
 * Notice that the contract is hardcoded 'eventstore'
 * @param network network instance of fabric-sdk
 * @returns `{ contract: Contract }`
 */
export const getContract: (network: Network) => Promise<{ contract: Contract }> = async (
  network
) => ({
  contract: network.getContract('eventstore'),
});
