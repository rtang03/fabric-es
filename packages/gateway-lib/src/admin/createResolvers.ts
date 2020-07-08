import util from 'util';
import { createNetworkOperator, NetworkOperator } from '@fabric-es/operator';
import { ApolloError } from 'apollo-server';
import ab2str from 'arraybuffer-to-string';
import { Wallet, X509Identity } from 'fabric-network';
import { getLogger } from '..';
import { catchErrors } from '../utils';

export const createResolvers: (option: {
  caAdmin: string;
  caAdminPW: string;
  channelName?: string;
  ordererTlsCaCert: string;
  ordererName: string;
  peerName: string;
  fabricNetwork: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  mspId: string;
  enrollmentSecret: string;
}) => Promise<any> = async ({
  caAdmin,
  caAdminPW,
  channelName = 'eventstore',
  ordererName,
  ordererTlsCaCert,
  peerName,
  fabricNetwork,
  connectionProfile,
  wallet,
  asLocalhost,
  mspId,
  enrollmentSecret,
}) => {
  const logger = getLogger('[gw-lib] createResolvers.js');

  let operator: NetworkOperator;

  try {
    operator = await createNetworkOperator({
      caAdmin,
      caAdminPW,
      channelName,
      ordererTlsCaCert,
      ordererName,
      fabricNetwork,
      connectionProfile,
      wallet,
      mspId,
    });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  const queries = await operator.getQueries();

  let ca;
  try {
    ca = await operator.identityService({ asLocalhost });
  } catch (e) {
    logger.error(util.format('createNetworkOperator error: %j', e));
    throw new Error(e);
  }

  return {
    Mutation: {
      createWallet: catchErrors(
        async (_, __, { username }) => {
          const res = await operator.registerAndEnroll({
            enrollmentId: username,
            enrollmentSecret,
            asLocalhost,
          });

          const registerResult = await res.registerAndEnroll();

          res.disconnect();

          if (registerResult instanceof Error) {
            logger.error(util.format('createWallet error: %j', registerResult));
            return new ApolloError(registerResult.message);
          }

          return registerResult?.status === 'SUCCESS';
        },
        { fcnName: 'createWallet', logger, useAuth: true, useAdmin: false }
      ),
    },
    Query: {
      isadmin: () => 'echo admin',
      getBlockByNumber: catchErrors(
        async (_, { blockNumber }: { blockNumber: number }) => {
          const chain = await queries.getChainInfo(peerName);
          if (chain.height.low <= blockNumber) {
            logger.warn('blockNumber is higher than chain height');
            return null;
          }
          const block = await queries.getBlockByNumber(blockNumber);

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
                    (arg) => ab2str(arg, 'utf8')
                  ),
                  rwset: JSON.stringify(
                    data.actions[0].payload?.action?.proposal_response_payload?.extension.results
                  ),
                  response: {
                    status:
                      data.actions[0]?.payload?.action?.proposal_response_payload?.extension
                        ?.response?.status,
                    message:
                      data.actions[0]?.payload?.action?.proposal_response_payload?.extension
                        ?.response.message || '',
                    payload: ab2str(
                      JSON.parse(
                        ab2str(
                          data.actions[0]?.payload?.action?.proposal_response_payload?.extension
                            ?.response?.payload,
                          'utf8'
                        )
                      ),
                      'utf8'
                    ),
                  },
                  endorsements: data.actions[0].payload.action.endorsements.map((item) => ({
                    endorser_mspid: item?.endorser?.Mspid,
                    id_bytes: item?.endorser?.IdBytes,
                    signature: JSON.stringify(item.signature),
                  })),
                })),
              }
            : new ApolloError('Unknown error to getBlockByNumber');
        },
        {
          fcnName: 'getBlockByNumber',
          logger,
          useAuth: false,
          useAdmin: true,
        }
      ),
      getCaIdentityByUsername: catchErrors(
        async (_, __, { username }) =>
          ca.getByEnrollmentId(username || '').then(({ result }) =>
            result
              ? {
                  id: result.id,
                  typ: result.type,
                  affiliation: result.affiliation,
                  max_enrollments: result.max_enrollments,
                  attrs: result.attrs,
                }
              : null
          ),
        { fcnName: 'getCaIdentityByEnrollmentId', logger, useAuth: false, useAdmin: true }
      ),
      getChainHeight: catchErrors(
        async () => queries.getChainInfo(peerName).then(({ height: { low } }) => low),
        {
          fcnName: 'getChainHeight',
          logger,
          useAuth: false,
          useAdmin: true,
        }
      ),
      getPeerInfo: catchErrors(async () => ({ mspId: queries.getMspid(), peerName }), {
        fcnName: 'getPeerInfo',
        logger,
        useAuth: false,
        useAdmin: true,
      }),
      getWallet: catchErrors(
        async (_, __, context) => {
          const identity = (await wallet.get(context.username)) as X509Identity;
          return identity
            ? {
                type: identity.type,
                mspId: identity.mspId,
                certificate: identity.credentials.certificate,
              }
            : null;
        },
        { fcnName: 'getWallet', logger, useAuth: true, useAdmin: false }
      ),
      listWallet: catchErrors(async () => wallet.list(), {
        fcnName: 'listWallet',
        logger,
        useAuth: false,
        useAdmin: true,
      }),
    },
  };
};
