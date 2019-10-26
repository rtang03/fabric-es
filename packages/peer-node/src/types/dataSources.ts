import {
  Document,
  DocumentEvent,
  Trade,
  TradeEvent,
  User,
  UserEvent
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
  docDataSource?: FabricData<Document, DocumentEvent>;
  tradeDataSource?: FabricData<Trade, TradeEvent>;
  userDataSource?: FabricData<User, UserEvent>;
  etcDataSource?: FabricData<EtcPo, EtcPoEvent>;
};
