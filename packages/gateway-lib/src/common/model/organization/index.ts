import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../..';
import { OrgCommands } from './domain/commands';
import { OrgEvents } from './domain/events';
import { Organization } from './domain/model';
export * from './domain/commands';
export * from './domain/events';
export * from './domain/handler';
export * from './domain/indices';
export * from './domain/model';
export * from './domain/reducer';
export * from './domain/typeGuard';
export { resolvers as orgResolvers } from './service/resolvers';
export { typeDefs as orgTypeDefs } from './service/schema';

export type OrgRepo = Repository<Organization, Organization, OrgEvents>;
export type OrgCommandHandler = CommandHandler<OrgCommands>;
export type OrgDataSource = DataSrc<OrgRepo>;

export type OrgContext = {
  dataSources: { organization: OrgDataSource };
  mspId: string;
};
