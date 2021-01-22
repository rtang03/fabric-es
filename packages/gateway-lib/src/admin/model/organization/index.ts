import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../..';
import { OrgCommands } from './domain/commands';
import { OrgEvents } from './domain/events';
import { Organization } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';

export type OrgRepo = Repository<Organization, OrgEvents>;
export type OrgCommandHandler = CommandHandler<OrgCommands>;
export type OrgDataSource = DataSrc<OrgRepo>;
