// Do not create ./utils/index.ts
// this affects the jest testing of service-admin-auth-int.test.ts

export { createGateway } from './utils/createGateway';
export { createService } from './utils/createService';
export { createAdminService } from './admin/createAdminService';
export { createRemoteService } from './remote/createRemoteService';
export { RemoteData } from './remote/remoteData';
export * from './admin/query';
