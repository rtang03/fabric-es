import util from 'util';
import type { Commit } from '../types';
import { isBaseEventArray } from '../utils';
import { isCommitHashFields } from './typeGuards';

/**
 * @about parse to original commit. Redis converts number into string. Besides, resume the shorted
 * field name, back to original commit. Notice that some computed fields, will be LOST.
 */
export const parseCommitHashFields: (input: any) => Commit = (input) => {
  if (isCommitHashFields(input)) {
    let version: number;
    let parsedEvents: unknown;
    try {
      // the returned value from Redis was converted to string;
      version = typeof input.v === 'string' ? parseInt(input.v, 10) : input.v;

      // restore the eventstring to BaseEvent[]
      parsedEvents = JSON.parse(input.evstr);
    } catch (e) {
      console.error(util.format('fail to parse commitHashFields: %s, %j', input?.cid, e));
      return null;
    }

    if (isBaseEventArray(parsedEvents)) {
      const commit: Required<Commit> = {
        commitId: input.cid,
        entityName: input.type,
        id: input.id,
        mspId: input.msp,
        version,
        entityId: input.id,
        eventsString: input.evstr,
        events: parsedEvents,
        hash: undefined, // for future implementation
      };
      return commit;
    }
  }
  console.error(`fail to parse commitHashFields: ${input?.cid}`);
  return null;
};
