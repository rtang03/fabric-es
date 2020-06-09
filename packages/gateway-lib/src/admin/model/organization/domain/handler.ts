import { OrgCommandHandler, OrgRepo } from '..';
import { Errors } from '../../../..';
import { OrgEvents } from './events';

export const orgCommandHandler: (option: { enrollmentId: string; orgRepo: OrgRepo }) => OrgCommandHandler = ({
  enrollmentId,
  orgRepo
}) => ({
  StartOrg: async ({ mspId, payload: { name, url, timestamp }}) => {
    if (!name) throw Errors.requiredDataMissing();
    const events: OrgEvents[] = [
      { type: 'OrgStarted', payload: { mspId, timestamp }},
      { type: 'OrgNameDefined', payload: { mspId, name, timestamp }}
    ];
    if (url) {
      events.push({ type: 'OrgUrlDefined', payload: { mspId, url, timestamp }});
    }
    return orgRepo.create({ enrollmentId, id: mspId }).save(events);
  },
  DefineOrgName: async ({ mspId, payload: { name, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.requiredDataMissing();
      if (!name) throw Errors.requiredDataMissing();
      return save([
        { type: 'OrgNameDefined', payload: { mspId, name, timestamp }}
      ]);
    }),
  DefineOrgUrl: async ({ mspId, payload: { url, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.requiredDataMissing();
      return save([
        { type: 'OrgUrlDefined', payload: { mspId, url, timestamp }}
      ]);
    }),
  ShutdownOrg: async ({ mspId, payload: { timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (currentState)
        return save([
          { type: 'OrgDowned', payload: { mspId, timestamp }}
        ]);
    })
});
