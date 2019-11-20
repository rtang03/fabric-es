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
  localRepo;

  constructor({
    repo,
    localRepo
  }: {
    repo?: Repository<TEntity, TEvent>;
    localRepo?: PrivatedataRepository<TEntity, TEvent>;
  }) {
    super();
    this.repo = repo;
    this.localRepo = localRepo;
  }

  initialize(config) {
    this.context = config.context;
  }
}

export type DataSources = {
  docDataSource?: FabricData<Document, DocumentEvents>;
  loanDataSource?: FabricData<Loan, LoanEvents>;
  userDataSource?: FabricData<User, UserEvents>;
  dtlsDataSource?: FabricData<LoanDetails, LoanDetailsEvents>;
};
