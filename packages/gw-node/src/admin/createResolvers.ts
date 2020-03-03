import util from 'util';
import { createNetworkOperator } from '@espresso/operator';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server';
import ab2str from 'arraybuffer-to-string';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import { UNAUTHORIZED_ACCESS, USER_NOT_FOUND } from './constants';

export const createResolvers: (option: {
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
  const logger = Client.getLogger('createResolvers.js');

  let operator;
  try {
    operator = await createNetworkOperator({
      channelName,
      ordererTlsCaCert,
      ordererName,
      context: {
        fabricNetwork,
        connectionProfile,
        wallet
      }
    });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  const queries = await operator.getQueries({ peerName });

  let ca;
  try {
    ca = await operator.identityService({
      caAdmin: caAdminEnrollmentId,
      asLocalhost
    });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  return {
    Mutation: {
      registerAndEnrollUser: async (
        _,
        {
          administrator,
          enrollmentId,
          enrollmentSecret
        }: {
          administrator: string;
          enrollmentId: string;
          enrollmentSecret: string;
        },
        { is_admin }
      ) => {
        if (!is_admin) {
          logger.warn('registerAndEnrollUser: %s', UNAUTHORIZED_ACCESS);
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }
        let registerResult;

        try {
          const res = await operator.registerAndEnroll({
            enrollmentId,
            enrollmentSecret,
            identity: administrator,
            asLocalhost
          });
          registerResult = await res.registerAndEnroll();
          res.disconnect();
        } catch (error) {
          logger.warn(util.format('prepare registerAndEnroll error: %j', error));
          return new ApolloError(error);
        }

        if (registerResult instanceof Error) {
          logger.error(util.format('registerAndEnroll error: %j', registerResult));
          return new ApolloError(registerResult.message);
        }
        return registerResult?.status === 'SUCCESS';
      }
    },
    Query: {
      getBlockByNumber: async (_, { blockNumber }: { blockNumber: number }) => {
        const chain = await queries.getChainInfo();

        if (chain.height.low <= blockNumber) {
          logger.warn('blockNumber is higher than chain height');
          return null;
        }

        let block;
        try {
          block = await queries.getBlockByNumber(blockNumber);
        } catch (e) {
          logger.error(util.format('fail to get block %s, %j', blockNumber, e));
          return null;
        }

        logger.info(`getBlockByNumber ${blockNumber}`);

        return block
          ? {
              block_number: block.header.number,
              previous_hash: block.header.previous_hash.toString(),
              data_hash: block.header.data_hash.toString(),
              no_of_tx: block.data.data.length,
              transaction: block.data.data.map(({ payload: { header, data } }) => ({
                tx_id: header.channel_header.tx_id,
                creator_mspid: header.signature_header.creator.Mspid,
                id_bytes: data.actions[0].header.creator.IdBytes,
                input_args: data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args.map(
                  arg => ab2str(arg, 'utf8')
                ),
                rwset: JSON.stringify(data.actions[0].payload?.action?.proposal_response_payload?.extension.results),
                response: {
                  status: data.actions[0]?.payload?.action?.proposal_response_payload?.extension?.response?.status,
                  message:
                    data.actions[0]?.payload?.action?.proposal_response_payload?.extension?.response.message || '',
                  payload: ab2str(
                    JSON.parse(
                      ab2str(
                        data.actions[0]?.payload?.action?.proposal_response_payload?.extension?.response?.payload,
                        'utf8'
                      )
                    ),
                    'utf8'
                  )
                },
                endorsements: data.actions[0].payload.action.endorsements.map(item => ({
                  endorser_mspid: item?.endorser?.Mspid,
                  id_bytes: item?.endorser?.IdBytes,
                  signature: JSON.stringify(item.signature)
                }))
              }))
            }
          : null;
      },
      getCaIdentityByEnrollmentId: async (_, { enrollmentId }: { enrollmentId: string }, { user_id }) => {
        if (!user_id) {
          logger.warn(`getCaIdentityByEnrollmentId, ${USER_NOT_FOUND}`);
          return new AuthenticationError(USER_NOT_FOUND);
        }

        if (user_id !== enrollmentId) {
          logger.warn(`getCaIdentityByEnrollmentId, ${UNAUTHORIZED_ACCESS}`);
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return ca
          .getByEnrollmentId(enrollmentId || '')
          .then(({ result }) => {
            if (result) {
              logger.info(`getCaIdentityByEnrollmentId: ${enrollmentId}`);
              return {
                id: result.id,
                typ: result.type,
                affiliation: result.affiliation,
                max_enrollments: result.max_enrollments,
                attrs: result.attrs
              };
            } else {
              logger.warn(`getCaIdentityByEnrollmentId fail: ${enrollmentId}`);
              return null;
            }
          })
          .catch(error => {
            logger.warn(util.format('getCaIdentityByEnrollmentId error: %j', error));
            return new ApolloError(error);
          });
      },
      getInstalledChaincodes: async () =>
        queries.getInstalledChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => {
            logger.info(`getInstalledChaincodes: ${cc.name}:${cc.version}`);
            return {
              name: cc.name,
              version: cc.version,
              path: cc.path
            };
          })
        ),
      getInstantiatedChaincodes: async () =>
        queries.getInstantiatedChaincodes().then(({ chaincodes }) =>
          chaincodes.map(cc => {
            logger.info(`getInstantiatedChaincodes: ${cc.name}:${cc.version}`);
            return {
              name: cc.name,
              version: cc.version,
              path: cc.path
            };
          })
        ),
      getInstalledCCVersion: async (_, { chaincode_id }: { chaincode_id: string }) => {
        const ver = await queries.getInstalledCCVersion(chaincode_id);
        logger.info('getInstalledCCVersion: ' + ver);
        return ver;
      },
      getChainHeight: async () => {
        const height = await queries.getChainInfo().then(({ height: { low } }) => low);
        logger.info('getChainHeight: ' + height);
        return height;
      },
      getMspid: async () => {
        const mspid = queries.getMspid();
        logger.info('getMspid: ' + mspid);
        return mspid;
      },
      getPeerName: async () => {
        logger.info('getPeerName: ' + peerName);
        return peerName;
      },
      isWalletExist: async (_, { label }: { label: string }) => {
        logger.info(`isWalletExist: ${label}`);

        return wallet.exists(label).catch(error => {
          logger.error(util.format('isWalletexist: %j', error));
          return new ApolloError(error);
        });
      },
      listWallet: async (_, __, { is_admin }) =>
        is_admin
          ? wallet.list().then(result => {
              logger.info('listWallet size: ' + result.length);
              return result ?? [];
            })
          : new ForbiddenError(UNAUTHORIZED_ACCESS)
    }
  };
};
