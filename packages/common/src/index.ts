import { PrivatedataRepository, Repository } from '@espresso/fabric-cqrs';
import { DataSource } from 'apollo-datasource';

export type CommandHandler<T> = { [C in keyof T]: (command: T[C]) => Promise<any> };

export const Errors = {
  insufficientPrivilege: () => new Error('INSUFFICIENT_PRIVILEGE'),
  invalidOperation: () => new Error('INVALID_OPERATION'),
  requiredDataMissing: () => new Error('REQUIRED_DATA_MISSING')
};

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

export type Paginated<TEntity> = {
  entities: TEntity[];
  hasMore: boolean;
  total: number;
};

export * from './document';
export * from './loan';
export * from './user';