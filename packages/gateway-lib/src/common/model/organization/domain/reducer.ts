import { ReducerCallback } from '@fabric-es/fabric-cqrs';
import { Organization, OrgEvents, OrgStatus } from '..';

/**
 * @about organization reducer
 * @param org
 * @param event
 */
export const orgReducer: ReducerCallback<Organization, OrgEvents> = (org: Organization, event: OrgEvents): Organization => {
  switch (event.type) {
    case 'OrgStarted':
      return {
        ...org,
        id: event.payload.mspId,
        mspId: event.payload.mspId,
        timestamp: event.payload.timestamp,
        status: OrgStatus.UP,
        // _ts: event.payload._ts,
        // _created: org?._created || event.payload?._created,
        // _creator: org?._creator || event.payload?._creator,
      };
    case 'OrgNameDefined':
      return {
        ...org,
        name: event.payload.name,
        // _ts: event.payload._ts,
        // _created: org?._created || event.payload?._created,
        // _creator: org?._creator || event.payload._creator,
      };
    case 'OrgUrlDefined':
      return {
        ...org,
        url: event.payload.url,
        // _ts: event.payload._ts,
        // _created: org?._created || event.payload?._created,
        // _creator: org?._creator || event.payload?._creator,
      };
    case 'OrgPubkeyLoaded':
      return {
        ...org,
        pubkey: event.payload.pubkey,
      };
    case 'OrgDowned':
      return {
        ...org,
        status: OrgStatus.DOWN,
        // _ts: event.payload._ts,
        // _created: org?._created || event.payload?._created,
        // _creator: org?._creator || event.payload?._creator,
      };
    default:
      return org; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
