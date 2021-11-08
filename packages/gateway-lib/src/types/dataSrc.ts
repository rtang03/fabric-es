import { DataSource } from 'apollo-datasource';

/**
 * @about apollo data source
 */
export class DataSrc<TRepo = any> extends DataSource {
  context;
  repo: TRepo;
  isPrivate: boolean;

  constructor({ repo, isPrivate }: { repo?: TRepo; isPrivate?: boolean }) {
    super();
    this.repo = repo;
    this.isPrivate = (isPrivate) ? true : false;
  }

  initialize(config) {
    this.context = config.context;
  }
}
