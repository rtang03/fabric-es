import { Commit } from '@fabric-es/fabric-cqrs';
import { DataSource } from 'apollo-datasource';
export { catchErrors } from './utils/catchErrors';
export { createGateway } from './utils/createGateway';
export { createGatewayV2 } from './utils/createGatewayV2';
export { createService } from './utils/createService';
export { getLogger } from './utils/getLogger';
export { createAdminService } from './admin/createAdminService';
export { createRemoteService, RemoteData } from './remote/createRemoteService';
export { createTrackingData, queryTrackingData } from './remote/createTrackingData';
export { createQueryHandlerService } from './query-handler';

export * from './admin/query';
export * from './admin/model/organization';

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

export type CommandHandler<TCommand> = {
  [C in keyof TCommand]: (command: TCommand[C]) => Promise<Commit>;
};

export const Errors = {
  insufficientPrivilege: () => new Error('INSUFFICIENT_PRIVILEGE'),
  invalidOperation: () => new Error('INVALID_OPERATION'),
  requiredDataMissing: () => new Error('REQUIRED_DATA_MISSING'),
  entityMissing: () => new Error('ENTITY_MISSING'),
};

