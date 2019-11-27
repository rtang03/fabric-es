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
import { DocContents, DocContentsEvents, LoanDetails, LoanDetailsEvents } from '../private';

export class FabricData<TEntity = any, TEvent = any> extends DataSource {
  context;
  repo;

  constructor({
    repo
  }: {
    repo?: Repository<TEntity, TEvent> | PrivatedataRepository<TEntity, TEvent>;
  }) {
    super();
    this.repo = repo;
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
  docContentsDataSource?: FabricData<DocContents, DocContentsEvents>;
};
