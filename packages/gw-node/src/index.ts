import { PrivatedataRepository, Repository } from '@espresso/fabric-cqrs';
import { DataSource } from 'apollo-datasource';
// Do not create ./utils/index.ts
// this affects the jest testing of service-admin-auth-int.test.ts

export { createGateway } from './utils/createGateway';
export { createService } from './utils/createService';
export { logger } from './utils/logger';
export { getLogger } from './utils/getLogger';
// export { createAdminService } from './admin/createAdminService';
export { createAdminServiceV2 } from './admin/createAdminServiceV2';
export { createRemoteService } from './remote/createRemoteService';
export { RemoteData } from './remote/remoteData';
export * from './admin/query';

export class DataSrc<TEntity = any, TEvent = any> extends DataSource {
  context;
  repo;

  constructor({ repo }: {
    repo?: Repository<TEntity, TEvent> | PrivatedataRepository<TEntity, TEvent>;
  }) {
    super();
    this.repo = repo;
  }

  initialize(config) {
    this.context = config.context;
  }
}
