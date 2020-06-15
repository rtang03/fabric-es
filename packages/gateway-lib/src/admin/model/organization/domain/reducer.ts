import { Organization, OrgEvents, OrgStatus } from '..';

/**
 * Org Reducer
 * @param history
 * @param initialState
 */
export const orgReducer = (org: Organization, event: OrgEvents): Organization => {
  switch (event.type) {
    case 'OrgStarted':
      return {
        id: event.payload.mspId,
        mspId: event.payload.mspId,
        timestamp: event.payload.timestamp,
        status: OrgStatus.UP,
        name: null
      };
    case 'OrgNameDefined':
      return {
        ...org,
        name: event.payload.name
      };
    case 'OrgUrlDefined':
      return {
        ...org,
        url: event.payload.url
      };
    case 'OrgDowned':
      return {
        ...org,
        status: OrgStatus.DOWN
      };
    default:
      return org; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
