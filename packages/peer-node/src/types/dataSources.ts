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
import { EtcPo, EtcPoEvent } from '../privatedata/types/etc-po';

export class FabricData<TEntity = any, TEvent = any> extends DataSource {
  context;
  repo;
  privatedataRepo;

  constructor({
    repo,
    privatedataRepo
  }: {
    repo?: Repository<TEntity, TEvent>;
    privatedataRepo?: PrivatedataRepository<TEntity, TEvent>;
  }) {
    super();
    this.repo = repo;
    this.privatedataRepo = privatedataRepo;
  }

  initialize(config) {
    this.context = config.context;
  }
}

export type DataSources = {
  docDataSource?: FabricData<Document, DocumentEvents>;
  loanDataSource?: FabricData<Loan, LoanEvents>;
  userDataSource?: FabricData<User, UserEvents>;
  etcDataSource?: FabricData<EtcPo, EtcPoEvent>;
};
