require('dotenv').config();
import { Contract, Network } from 'fabric-network';

export const getContract: (
  network: Network,
  privatedata?: boolean
) => Promise<{ contract: Contract }> = async (network, privatedata = false) => {
  try {
    const chaincodeId = privatedata
      ? process.env.CHAINCODE_ID_PRIVATEDATA || 'privatedata'
      : process.env.CHAINCODE_ID || 'eventstore';

    if (!chaincodeId) {
      console.error('Missing CHAINCODE_ID in .env');
      return null;
    }
    const contract = await network.getContract(chaincodeId);
    return { contract };
  } catch (error) {
    console.error(error);
  }
};
