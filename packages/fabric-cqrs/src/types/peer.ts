// import { Gateway, Network, Wallet } from 'fabric-network';
// import { PrivatedataRepository } from './privatedataRepository';
// import { ProjectionDb } from './projectionDb';
// import { QueryDatabase } from './queryDatabase';
// import { Reducer } from './reducer';
// import { Repository } from './repository';
//
// export interface PeerOption {
//   queryDatabase: QueryDatabase;
//   network: Network;
//   gateway: Gateway;
//   channelName: string;
//   wallet: Wallet;
//   connectionProfile: string;
// }
//
// export interface Peer {
//   getPrivateDataRepo: <TEntity = any, TEvent = any>(getPrivateDataRepoOption: {
//     entityName: string;
//     reducer: Reducer;
//   }) => PrivatedataRepository<TEntity, TEvent>;
//
//   getRepository: <TEntity = any, TEvent = any>(getRepositoryOption: {
//     entityName: string;
//     reducer: Reducer;
//   }) => Repository<TEntity, TEvent>;
//
//   /** gateway.disconnect() of fabric-sdk, use for tear-down of jest tests */
//   disconnect: () => void;
// }
