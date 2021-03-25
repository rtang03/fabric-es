import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { CredentialCommands } from './commands';
import type { CredentialEvents } from './events';

export * from './credential';
export * from './events';
export * from './presentation';
export * from './commands';

export type CredentialRepo = PrivateRepository<Credential, CredentialEvents>;
export type CredentialCommandHandler = CommandHandler<CredentialCommands>;
export type CredentialDataSource = DataSrc<CredentialRepo>;
