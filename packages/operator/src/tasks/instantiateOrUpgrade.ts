import { readFileSync } from 'fs';
import util from 'util';
import Client, { ChaincodeInstantiateUpgradeRequest, ProposalResponse } from 'fabric-client';
import { MISSING_CC_VERSION, MISSING_CHAINCODE_ID } from '../types';
import { getClientForOrg, isProposalErrorResponse, isProposalResponse } from '../utils';

// todo: In v2, the instantiate or update are replaced by lifecyle chaincode
export const instantiateOrUpdate = option => async ({
  chaincodeId,
  chaincodeVersion,
  fcn,
  args,
  upgrade,
  endorsementPolicy,
  collectionsConfig,
  timeout
}: {
  chaincodeId: string;
  chaincodeVersion: string;
  fcn: string;
  args: string[];
  upgrade: boolean;
  endorsementPolicy: any;
  collectionsConfig?: string;
  timeout?: number;
}) => {
  const logger = Client.getLogger('instantiateOrUpdate.js');

  if (!chaincodeId) throw new Error(MISSING_CHAINCODE_ID);
  if (!chaincodeVersion) throw new Error(MISSING_CC_VERSION);

  const { channelName, fabricNetwork, ordererName, ordererTlsCaCert, connectionProfile } = option;

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  const channel = client.getChannel(channelName);

  let pem;

  try {
    pem = Buffer.from(readFileSync(ordererTlsCaCert)).toString();
  } catch (e) {
    logger.error(util.format('fail to read pem, %j', e));
    throw new Error(e);
  }

  const orderer = client.newOrderer(client.getOrderer(ordererName).getUrl(), {
    pem,
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });
  channel.addOrderer(orderer);

  const targets = client.getPeersForOrg().map(p => p.getName());

  const txId = client.newTransactionID(true);

  const deployId = txId.getTransactionID();

  const request: ChaincodeInstantiateUpgradeRequest = {
    targets,
    chaincodeId,
    chaincodeVersion,
    chaincodeType: 'node',
    fcn,
    args,
    txId
  };

  if (endorsementPolicy) request['endorsement-policy'] = endorsementPolicy;

  if (collectionsConfig) request['collections-config'] = collectionsConfig;

  const [proposalResponses, proposal] = upgrade
    ? await channel.sendUpgradeProposal(request, timeout)
    : await channel.sendInstantiateProposal(request, timeout);

  const allGood = proposalResponses.reduce(
    (prev, curr) => (isProposalErrorResponse(curr) ? false : prev && isProposalResponse(curr)),
    true
  );

  if (allGood) {
    const promises = [];
    const hubs = channel.getChannelEventHubsForOrg();
    hubs.forEach(hub => {
      promises.push(
        new Promise((resolve, reject) => {
          const handler = setTimeout(() => hub.disconnect(), timeout);
          hub.registerTxEvent(
            deployId,
            (tid, code, block) => {
              const peerAddr = hub.getPeerAddr();
              const message = util.format(
                `%s chaincode at %s ::Tx %s ::Status %s ::Blk %s`,
                upgrade ? 'upgrade' : 'instantiate',
                peerAddr,
                tid,
                code,
                block
              );
              logger.info(message);
              clearTimeout(handler);
              resolve(message);
            },
            error => {
              clearTimeout(handler);
              logger.error(util.format('registerTxEvent error, %j', error));
              reject(error);
            },
            { unregister: true, disconnect: true }
          );
          hub.connect();
        })
      );
    });

    promises.push(
      channel.sendTransaction({
        txId,
        proposal,
        proposalResponses: proposalResponses as ProposalResponse[]
      })
    );

    return Promise.all(promises).then(res => ({
      ...res.pop(),
      results: res
    }));
  } else {
    logger.error(
      util.format(
        '%s chaincode "%s" v=%s proposal fail, targets=%j',
        upgrade ? 'upgrade' : 'instantiate',
        chaincodeId,
        chaincodeVersion,
        targets
      )
    );

    throw new Error(util.format('instantiate or upgrade chaincode proposal fail: %j', proposalResponses));
  }
};
