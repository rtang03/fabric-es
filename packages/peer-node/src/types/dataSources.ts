import {
  Document,
  DocumentEvents,
  Loan,
  LoanEvents,
  User,
  UserEvents
} from '@espresso/common';
import { PrivatedataRepository, Repository } from '@espresso/fabric-cqrs';
import { DataSource } from 'apollo-datasource';
import { LoanDetails, LoanDetailsEvents } from '../private';

export class FabricData<TEntity = any, TEvent = any> extends DataSource {
  context;
  repo;
  privateRepo;

  constructor({
    repo,
    privateRepo
  }: {
    repo?: Repository<TEntity, TEvent>;
    privateRepo?: PrivatedataRepository<TEntity, TEvent>;
  }) {
    super();
    this.repo = repo;
    this.privateRepo = privateRepo;
  }

  initialize(config) {
    this.context = config.context;
  }
}

export type DataSources = {
  docDataSource?: FabricData<Document, DocumentEvents>;
  loanDataSource?: FabricData<Loan, LoanEvents>;
  userDataSource?: FabricData<User, UserEvents>;
  loanDetailsDataSource?: FabricData<LoanDetails, LoanDetailsEvents>;
};
