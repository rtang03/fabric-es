import {
  createIdentityService,
  createUser,
  getPeerInfo
} from '@espresso/admin-tool';
import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
  ValidationError
} from 'apollo-server';
import ab2str from 'arraybuffer-to-string';
import { FileSystemWallet } from 'fabric-network';
import { includes } from 'lodash';
import { Resolvers } from '../generated/peer-resolvers-types';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from './contants';

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
  }).catch(err => {
    console.error(err);
    throw new ApolloError('peer-info error');
  });

  const idService = await createIdentityService({
    connectionProfile,
    wallet
  }).catch(err => {
    console.error(err);
    throw new ApolloError('identity service error');
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
        idService
          .getByEnrollmentId(enrollmentId)
          .then(() => false)
          .catch(error => {
            if (includes(error.message, 'Failed to get User')) {
              return createUser(enrollmentId, enrollmentSecret, {
                connectionProfile,
                wallet
              }).then(result => result?.status === 'SUCCESS');
            } else throw new ValidationError(error.message);
          })
    },
    Query: {
      getChannelPeers: async () =>
        peerInfo
          .getChannelPeers()
          .then(peers =>
            peers.map(peer => ({
              name: peer.getName(),
              mspid: peer.getMspid(),
              url: peer.getUrl()
            }))
          )
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
      isWalletEntryExist: async (_, { label }: { label: string }) =>
        wallet.exists(label).catch(error => {
          console.error(error);
          throw new ApolloError(error.message);
        }),
      listWallet: async (_, __, { is_admin }) => {
        if (is_admin)
          return wallet
            .list()
            .then(result => result ?? [])
            .catch(error => {
              console.error(error);
              throw new ApolloError(error.message);
            });
        else throw new ForbiddenError(UNAUTHORIZED_ACCESS);
      },
      getCaIdentityByEnrollmentId: async (
        _,
        { enrollmentId }: { enrollmentId: string },
        { user_id }
      ) => {
        if (!user_id) throw new AuthenticationError(USER_NOT_FOUND);
        if (user_id === enrollmentId)
          return idService
            .getByEnrollmentId(enrollmentId || '')
            .then(({ result }) =>
              result
                ? {
                    id: result.id,
                    typ: result.type,
                    affiliation: result.affiliation,
                    max_enrollments: result.max_enrollments,
                    attrs: result.attrs
                  }
                : null
            )
            .catch(error => {
              if (includes(error.message, 'Failed to get User')) return null;
              else throw new ValidationError(error.message);
            });
        else throw new ForbiddenError(UNAUTHORIZED_ACCESS);
      },
      getCaIdentities: async (_, __, { is_admin }) => {
        if (is_admin)
          return idService
            .getAll()
            .then(({ result }) =>
              result?.identities
                ? result?.identities.map(
                    ({ id, type, affiliation, max_enrollments, attrs }) => ({
                      id,
                      typ: type,
                      affiliation,
                      max_enrollments,
                      attrs
                    })
                  )
                : []
            )
            .catch(error => {
              if (includes(error.message, 'Failed to get User')) return [];
              else throw new ValidationError(error?.message);
            });
        else throw new ForbiddenError(UNAUTHORIZED_ACCESS);
      },
      getCollectionConfigs: async () =>
        peerInfo
          .getCollectionsConfig({
            chaincodeId: 'privatedata',
            target: peerName
          })
          .then(configs =>
            configs
              ? configs.map(config => ({
                  name: config.name,
                  typ: config.type,
                  required_peer_count: config.required_peer_count,
                  maximum_peer_count: config.maximum_peer_count,
                  member_read_only: config.member_only_read,
                  block_to_live: config.block_to_live,
                  policy: JSON.stringify(config.policy)
                }))
              : []
          )
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
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
                  rwset: JSON.stringify(
                    data.actions[0].payload.action.proposal_response_payload
                      .extension.results
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
                        endorser_mspid: item.endorser.Mspid,
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
        peerInfo
          .getInstalledChaincodes()
          .then(({ chaincodes }) =>
            chaincodes.map(cc => ({
              name: cc.name,
              version: cc.version,
              path: cc.path
            }))
          )
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
      getInstantiatedChaincodes: async () =>
        peerInfo
          .getInstantiatedChaincodes()
          .then(({ chaincodes }) =>
            chaincodes.map(cc => ({
              name: cc.name,
              version: cc.version,
              path: cc.path
            }))
          )
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
      getInstalledCCVersion: async (
        _,
        { chaincode_id }: { chaincode_id: string }
      ) =>
        peerInfo.getInstalledCCVersion(chaincode_id).catch(error => {
          console.error(error);
          throw new ApolloError(error.message);
        }),
      getChainHeight: async () =>
        peerInfo
          .getChainInfo()
          .then(({ height: { low } }) => low)
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
      getChannelInfo: async () =>
        peerInfo
          .getChannels()
          .then(({ channels }) => channels)
          .catch(error => {
            console.error(error);
            throw new ApolloError(error.message);
          }),
      getMspid: async () =>
        peerInfo.getMspid().catch(error => {
          console.error(error);
          throw new ApolloError(error.message);
        }),
      getPeerName: async () => peerName,
      getPeerInfo: async () => ({
        mspid: await peerInfo.getMspid(),
        peerName
      })
    }
  };
};
