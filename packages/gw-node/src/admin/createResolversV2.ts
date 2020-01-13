import { createNetworkOperator } from '@espresso/operator';
import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server';
import ab2str from 'arraybuffer-to-string';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import util from 'util';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from './constants';

export const createResolversV2: (option: {
  channelName?: string;
  ordererTlsCaCert: string;
  ordererName: string;
  peerName: string;
  caAdminEnrollmentId: string;
  fabricNetwork: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
}) => Promise<any> = async ({
  channelName = 'eventstore',
  ordererName,
  ordererTlsCaCert,
  peerName,
  caAdminEnrollmentId,
  fabricNetwork,
  connectionProfile,
  wallet,
  asLocalhost
}) => {
  const logger = Client.getLogger('createResolversV2');
  const operator = await createNetworkOperator({
    channelName,
    ordererTlsCaCert,
    ordererName,
    context: {
      fabricNetwork,
      connectionProfile,
      wallet
    }
  });

  const queries = await operator.getQueries({ peerName });
  const ca = await operator.identityService({
    caAdmin: caAdminEnrollmentId,
    asLocalhost
  });

  return {
    Mutation: {
      registerAndEnrollUser: async (
        _,
        {
          enrollmentId,
          enrollmentSecret
        }: { enrollmentId: string; enrollmentSecret: string },
        { is_admin }
      ) => {
        is_admin = true;
        return is_admin
          ? operator.registerAndEnroll({
              enrollmentId,
              enrollmentSecret,
              identity: enrollmentId,
              asLocalhost
            })
          : new ForbiddenError(UNAUTHORIZED_ACCESS);
      }
    },
    Query: {
      getBlockByNumber: async (_, { blockNumber }: { blockNumber: number }) => {
        logger.info('getBlockByNumber');

        const chain = await queries.getChainInfo();
        if (chain.height.low <= blockNumber) {
          logger.info('blockNumber is higher than chain height');
          return null;
        }

        const block = await queries.getBlockByNumber(blockNumber);
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
                    data.actions[0].payload?.action?.proposal_response_payload
                      ?.extension.results
                  ),
                  response: {
                    status:
                      data.actions[0]?.payload?.action
                        ?.proposal_response_payload?.extension?.response
                        ?.status,
                    message:
                      data.actions[0]?.payload?.action
                        ?.proposal_response_payload?.extension?.response
                        .message || '',
                    payload: ab2str(
                      JSON.parse(
                        ab2str(
                          data.actions[0]?.payload?.action
                            ?.proposal_response_payload?.extension?.response
                            ?.payload,
                          'utf8'
                        )
                      ),
                      'utf8'
                    )
                  },
                  endorsements: data.actions[0].payload.action.endorsements.map(
                    item => ({
                      endorser_mspid: item?.endorser?.Mspid,
                      id_bytes: item?.endorser?.IdBytes,
                      signature: JSON.stringify(item.signature)
                    })
                  )
                })
              )
            }
          : null;
      },
      getCaIdentityByEnrollmentId: async (
        _,
        { enrollmentId }: { enrollmentId: string },
        { user_id }
      ) => {
        logger.info('getCaIdentityByEnrollmentId');

        if (!user_id) throw new AuthenticationError(USER_NOT_FOUND);
        return user_id === enrollmentId
          ? ca.getByEnrollmentId(enrollmentId || '').then(({ result }) =>
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
          : new ForbiddenError(UNAUTHORIZED_ACCESS);
      },
      getInstalledChaincodes: async () => {
        logger.info('getInstalledChaincodes');

        return queries.getInstalledChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => ({
            name: cc.name,
            version: cc.version,
            path: cc.path
          }))
        );
      },
      getInstantiatedChaincodes: async () => {
        logger.info('getInstantiatedChaincodes');

        return queries.getInstantiatedChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => ({
            name: cc.name,
            version: cc.version,
            path: cc.path
          }))
        );
      },
      getInstalledCCVersion: async (
        _,
        { chaincode_id }: { chaincode_id: string }
      ) => {
        logger.info('getInstalledCCVersion');

        return queries.getInstalledCCVersion(chaincode_id);
      },
      getChainHeight: async () => {
        logger.info('getChainHeight');

        return queries.getChainInfo().then(({ height: { low } }) => low);
      },
      getMspid: async () => {
        logger.info('getMspid');

        return queries.getMspid();
      },
      getPeerName: async () => {
        logger.info('getPeerName');

        return peerName;
      },
      isWalletExist: async (_, { label }: { label: string }) => {
        logger.info(`isWalletExist: ${label}`);

        return wallet.exists(label).catch(error => {
          logger.error(util.format('isWalletexist: %j', error));
          return new ApolloError(error);
        });
      },
      listWallet: async (_, __, { is_admin }) => {
        logger.info('listWallet');

        return is_admin
          ? wallet.list().then(result => result ?? [])
          : new ForbiddenError(UNAUTHORIZED_ACCESS);
      }
    }
  };
};
