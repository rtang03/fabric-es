import { PrivatedataRepository, Repository } from '@fabric-es/fabric-cqrs';
import { DataSource } from 'apollo-datasource';

export { createGateway } from './utils/createGateway';
export { createService } from './utils/createService';
export { getLogger } from './utils/getLogger';
export { createAdminService } from './admin/createAdminService';
export { createRemoteService } from './remote/createRemoteService';
export { RemoteData } from './remote/remoteData';
export * from './admin/query';

export class DataSrc<TEntity = any, TEvent = any> extends DataSource {
  context;
  repo;

  constructor({ repo }: { repo?: Repository<TEntity, TEvent> | PrivatedataRepository<TEntity, TEvent> }) {
    super();
    this.repo = repo;
  }

  initialize(config) {
    this.context = config.context;
  }
}

export type CommandHandler<T> = { [C in keyof T]: (command: T[C]) => Promise<any> };

export const Errors = {
  insufficientPrivilege: () => new Error('INSUFFICIENT_PRIVILEGE'),
  invalidOperation: () => new Error('INVALID_OPERATION'),
  requiredDataMissing: () => new Error('REQUIRED_DATA_MISSING')
};

export type Paginated<TEntity> = {
  entities: TEntity[];
  hasMore: boolean;
  total: number;
};
