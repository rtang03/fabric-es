import { Contract, Network } from 'fabric-network';

/**
 * @about return contract of fabric-sdk
 * Notice that the contract is hardcoded 'eventstore'
 * @params [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html)
 * @returns `{ contract: fabric-network.Contract }`
 */
export const getContract: (network: Network) => Promise<{ contract: Contract }> = async (
  network
) => ({
  contract: network.getContract('eventstore'),
});
