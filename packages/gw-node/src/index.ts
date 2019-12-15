// Do not create ./utils/index.ts
// this affects the jest testing of service-admin-auth-int.test.ts

export { createGateway } from './utils/createGateway';
export { startService } from './utils/start-service';
export { createRemoteDataService } from './remote-data/createRemoteDataService';
export { RemoteData } from './remote-data/remoteData';
export * from './admin/query';
