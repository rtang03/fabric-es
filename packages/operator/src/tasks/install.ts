import Client from 'fabric-client';
import { readFileSync } from 'fs';
import util from 'util';
import {
  CreateNetworkOperatorOption,
  MISSING_CC_VERSION,
  MISSING_CHAINCODE_ID, MISSING_CHAINCODE_PATH
} from '../types';
import { getClientForOrg } from '../utils';

export const install = (option: CreateNetworkOperatorOption) => async ({
  chaincodeId,
  chaincodeVersion,
  chaincodePath,
  targets,
  timeout = 60000
}: {
  chaincodeId: string;
  chaincodeVersion: string;
  chaincodePath: string;
  targets: string[];
  timeout?: number;
}) => {
  if (!chaincodeId) throw new Error(MISSING_CHAINCODE_ID);
  if (!chaincodeVersion) throw new Error(MISSING_CC_VERSION);
  if (!chaincodePath) throw new Error(MISSING_CHAINCODE_PATH);

  const logger = Client.getLogger('Install chaincode');
  const {
    channelName,
    fabricNetwork,
    ordererName,
    ordererTlsCaCert,
    connectionProfile
  } = option;
  const client: Client = await getClientForOrg(connectionProfile, fabricNetwork);
  const channel = client.getChannel(channelName);
  const orderer = client.newOrderer(client.getOrderer(ordererName).getUrl(), {
    pem: Buffer.from(readFileSync(ordererTlsCaCert)).toString(),
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });
  channel.addOrderer(orderer);

  // TODO: In V2, need not install every peers individually
  // const targets = client.getPeersForOrg().map(p => p.getName());
  const txId = client.newTransactionID(true);

  logger.info(
    util.format(
      'install chaincode "%s", v=%s onto %j',
      chaincodeId,
      chaincodeVersion,
      targets
    )
  );

  return client.installChaincode(
    {
      targets,
      chaincodeVersion,
      chaincodeId,
      chaincodeType: 'node',
      chaincodePath,
      txId
    },
    timeout
  );
};