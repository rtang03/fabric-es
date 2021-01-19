import { DataSource } from 'apollo-datasource';

/**
 * Apollo Data Source
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
