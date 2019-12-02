import {
  createIdentityService,
  createUser,
  getPeerInfo
} from '@espresso/admin-tool';
import ab2str from 'arraybuffer-to-string';
import { FileSystemWallet } from 'fabric-network';
import { Resolvers } from '../generated/peer-resolvers-types';

export const createResolvers: (option: {
  channelName: string;
  peerName: string;
  context: {
    connectionProfile: string;
    fabricNetwork: string;
    wallet: FileSystemWallet;
  };
}) => Promise<Resolvers> = async ({
  channelName,
  peerName,
  context: { connectionProfile, fabricNetwork, wallet }
}) => {
  const peerInfo = await getPeerInfo(channelName, peerName, {
    connectionProfile,
    fabricNetwork
  });
  const idService = await createIdentityService({
    connectionProfile,
    wallet
  });
  return {
    Mutation: {
      registerAndEnrollUser: async (
        _,
        {
          enrollmentId,
          enrollmentSecret
        }: { enrollmentId: string; enrollmentSecret: string }
      ) =>
        idService.getByEnrollmentId(enrollmentId).then(({ result }) =>
          result?.id
            ? null
            : createUser(enrollmentId, enrollmentSecret, {
                connectionProfile,
                wallet
              }).then(result => result?.status === 'SUCCESS')
        )
    },
    Query: {
      isWalletEntryExist: async (_, { label }: { label: string }) =>
        wallet.exists(label),
      listWallet: async () => wallet.list().then(result => result ?? []),
      getCaIdentityByEnrollmentId: async (
        _,
        { enrollmentId }: { enrollmentId: string }
      ) =>
        idService.getByEnrollmentId(enrollmentId).then(({ result }) =>
          result
            ? {
                id: result.id,
                typ: result.type,
                affiliation: result.affiliation,
                max_enrollments: result.max_enrollments,
                attrs: result.attrs
              }
            : null
        ),
      getCaIdentities: async () =>
        idService.getAll().then(({ result }) =>
          result?.identities
            ? result.identities.map(
                ({ id, type, affiliation, max_enrollments, attrs }) => ({
                  id,
                  typ: type,
                  affiliation,
                  max_enrollments,
                  attrs
                })
              )
            : []
        ),
      getBlockByNumber: async (_, { blockNumber }: { blockNumber: number }) => {
        const chain = await peerInfo.getChainInfo();
        if (chain.height.low <= blockNumber) return null;
        const block = await peerInfo.getBlockByNumber(blockNumber);
        return block
          ? {
              block_number: block.header.number,
              previous_hash: block.header.previous_hash.toString(),
              data_hash: block.header.data_hash.toString(),
              no_of_tx: block.data.data.length,
              transaction: block.data.data.map(
                ({ payload: { header, data } }) => ({
                  tx_id: header.channel_header.tx_id,
                  creator_mspid: header.signature_header.creator.Mspid,
                  id_bytes: data.actions[0].header.creator.IdBytes,
                  input_args: data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args.map(
                    arg => ab2str(arg, 'utf8')
                  ),
                  key: JSON.stringify(
                    data.actions[0].payload.action.proposal_response_payload
                      .extension.results.ns_rwset[0].rwset.writes[0].key
                  ),
                  value: JSON.stringify(
                    data.actions[0].payload.action.proposal_response_payload
                      .extension.results.ns_rwset[0].rwset.writes[0].value
                  ),
                  response: {
                    status:
                      data.actions[0].payload.action.proposal_response_payload
                        .extension.response.status,
                    message:
                      data.actions[0].payload.action.proposal_response_payload
                        .extension.response.message || '',
                    payload: ab2str(
                      JSON.parse(
                        ab2str(
                          data.actions[0].payload.action
                            .proposal_response_payload.extension.response
                            .payload,
                          'utf8'
                        )
                      ),
                      'utf8'
                    )
                  },
                  endorsements: data.actions[0].payload.action.endorsements.map(
                    item => {
                      return {
                        endoser_mspid: item.endorser.Mspid,
                        id_bytes: item.endorser.IdBytes,
                        signature: JSON.stringify(item.signature)
                      };
                    }
                  )
                })
              )
            }
          : null;
      },
      getInstalledChaincodes: async () =>
        peerInfo.getInstalledChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => ({
            name: cc.name,
            version: cc.version,
            path: cc.path
          }))
        ),
      getInstantiatedChaincodes: async () =>
        peerInfo.getInstantiatedChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => ({
            name: cc.name,
            version: cc.version,
            path: cc.path
          }))
        ),
      getInstalledCCVersion: async (
        _,
        { chaincode_id }: { chaincode_id: string }
      ) => peerInfo.getInstalledCCVersion(chaincode_id),
      getChainHeight: async () =>
        peerInfo.getChainInfo().then(({ height: { low } }) => low),
      getChannelInfo: async () =>
        peerInfo.getChannels().then(({ channels }) => channels),
      getMspid: async () => peerInfo.getMspid()
    }
  };
};
