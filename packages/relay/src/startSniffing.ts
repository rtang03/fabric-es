// import util from 'util';
// import { Redis } from 'ioredis';
// import { getLogger } from './getLogger';
// import { isReqRes, ReqRes } from './reqres';

// const logger = getLogger('[sniffer] startSniffing.js');

// export const startSniffing: (option: {
//   client: Redis;
//   topic: string;
//   callback?: (channel: string, message: ReqRes, messageStr?: string) => void;
// }) => Promise<{
//   read: number;
//   count: number;
// }> = ({
//   client, topic, callback
// }) => {
//   return new Promise<{ read: number; count: number }>(async (resolve, reject) => {
//     let read = 0;
//     if (!client)
//       reject(new Error('Client missing'));
//     else if (!topic)
//       reject(new Error('Topic missing'));
//     else {
//       try {
//         // Get existing messages first
//         const msgs = (await client.xrange(topic, '-', Date.now())).map(str => {
//           if (callback) {
//             try {
//               const msg = JSON.parse(str[1][1]);
//               if (isReqRes(msg))
//                 callback(topic, msg);
//               else {
//                 logger.warn(`Existing message of unknown type: '${str[1][1]}'`);
//                 callback(topic, null, str[1][1]);
//               }
//             } catch (error) {
//               logger.warn(`Existing non-JSON message: '${str[1][1]}'`);
//               callback(topic, null, str[1][1]);
//             }
//           } else
//             logger.info(`Existing message from '${topic}': '${str[1][1]}'`);
//           return str;
//         });
//         read = msgs.length;

//         // Setup event handler
//         client.on('message', async (channel, message) => {
//           if (callback) {
//             try {
//               const msg = // JSON.parse(message);
//               if (isReqRes(msg))
//                 callback(channel, msg);
//               else {
//                 logger.warn(`Received message of unknown type: '${message}'`);
//                 callback(channel, null, message);
//               }
//             } catch (error) {
//               logger.warn(`Received non-JSON message: '${message}'`);
//               callback(topic, null, message);
//             }
//           } else
//             logger.info(`Received message from '${channel}': '${message}'`);
//         });

//         // Start subscription
//         client.subscribe(topic, (error, count) => {
//           if (error)
//             reject(new Error(util.format('An error occurred subscribing to REDIS topic %s: %j', topic, error)));
//           else {
//             logger.info(`Subscribed to REDIS topic ${topic} successfully (${count})`);
//             resolve({
//               read, count
//             });
//           }
//         });
//       } catch (error) {
//         reject(new Error(util.format('Client already in subscription mode: %j', error)));
//       }
//     }
//   });
// };