import { ChannelEventHub } from 'fabric-client';
import { Commit, Context } from '../types';

export const channelEventHub: (
  hub: ChannelEventHub
) => {
  registerCCEvent: (context: Context) => Promise<any>;
  close: (registerId: string) => void;
} = hub => ({
  registerCCEvent: ({ onChannelEventArrived }) =>
    new Promise((resolve, reject) => {
      hub.connect({ full_block: true }, (err, status) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.info('Channel event hub connected');
          resolve(
            hub.registerChaincodeEvent(
              'eventstore',
              'createCommit',
              ({ tx_id, payload }) => {
                // console.log(`🚕 Channel event arrived: ${tx_id}`);
                const channelEvent = payload.toString('utf8');
                try {
                  const commit: Commit = JSON.parse(channelEvent);
                  commit.version = parseInt(commit.version as any, 10);
                  onChannelEventArrived({ commit });
                } catch (e) {
                  console.error('Error to parse the channel events');
                }
              },
              error => {
                console.error('Error in chaincode event');
                console.error(error);
              }
            )
          );
        }
      });
    }),
  close: registerId => hub.unregisterChaincodeEvent(registerId, true)
});
