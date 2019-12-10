import { PrivatedataRepository, Repository } from '@espresso/fabric-cqrs';
import { DataSource } from 'apollo-datasource';

/**
 * **model-loan** is the domain model of a generic bank loan workflow processing.
 * On-Chain data:
 *  > 3 top-concern entities are defined: User, Loan and Document:
 *  > User - pseudo-identities of involved parties, such as loan applicants, banks, financial data providers, etc, in the workflow.
 *  > Loan - Place-holder of a loan application on the public block-chain. Contain public information only.
 *  > Document - Place-holder of documents submitted by the loan applicants relevent to the loan applications. Contain public information only.
 * Private data:
 *  > LoanDetails - Details information assoicate with an on-chain loan application entity.
 *  > DocContents - Content of a document associate with an on-chain document entity.
 */
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

export * from './user';
