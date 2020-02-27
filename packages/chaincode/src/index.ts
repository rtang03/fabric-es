import { EventStore } from './contract/eventstore';
import { PrivateData } from './contract/privateData';
import { BaseEvent, Commit, createCommitId, createInstance } from './ledger-api';
import { CONTEXT, NAMESPACE, RESOURCE } from './ngac/types';

export { CONTEXT, NAMESPACE, RESOURCE, BaseEvent, EventStore, Commit, createInstance };

export const contracts: any[] = [EventStore, PrivateData];
