import Client, { ChannelEventHub } from 'fabric-client';
import util from 'util';
import { Commit, PeerOptions } from '../types';

export const channelEventHub: (
  hub: ChannelEventHub
) => {
  registerCCEvent: (
    options: Pick<PeerOptions, 'onChannelEventArrived'>
  ) => Promise<any>;
  close: (registerId: string) => void;
} = hub => ({
  registerCCEvent: ({ onChannelEventArrived }) =>
    new Promise((resolve, reject) => {
      const logger = Client.getLogger('ChannelEventHub');
      hub.connect({ full_block: true }, (err, status) => {
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          logger.info('Channel event hub connected');
          resolve(
            hub.registerChaincodeEvent(
              'eventstore',
              'createCommit',
              ({ tx_id, payload }) => {
                logger.info(`Channel event arrived: ${tx_id}`);
                const channelEvent = payload.toString('utf8');
                try {
                  const commit: Commit = JSON.parse(channelEvent);
                  commit.version = parseInt(commit.version as any, 10);
                  onChannelEventArrived({ commit });
                } catch (e) {
                  logger.error('Error to parse the incoming channel events');
                }
              },
              error => {
                logger.error(
                  util.format('Error in chaincode event: %j', error)
                );
              }
            )
          );
        }
      });
    }),
  close: registerId => hub.unregisterChaincodeEvent(registerId, true)
});
