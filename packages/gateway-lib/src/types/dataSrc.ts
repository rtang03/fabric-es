import { DataSource } from 'apollo-datasource';

/**
 * @about apollo data source
 */
export class DataSrc<TRepo = any> extends DataSource {
  context;
  repo: TRepo;

  constructor({ repo }: { repo?: TRepo }) {
    super();
    this.repo = repo;
  }

  initialize(config) {
    this.context = config.context;
  }
}
