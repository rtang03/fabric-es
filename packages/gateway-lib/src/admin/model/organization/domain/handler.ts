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
    return orgRepo.create({ enrollmentId, id: mspId }) // TODO HERE Fix also - add "id" to reducer output
      .save({ events })
      .then(({ data, status }) => (status === 'OK' ? Object.values(data)[0] : null)); // TODO HERE Fix fabric-cqrs to eliminate the need to "then" everytime
  },
  DefineOrgName: async ({ mspId, payload: { name, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.entityMissing();
      if (!name) throw Errors.requiredDataMissing();
      return save({ events: [
        { type: 'OrgNameDefined', payload: { mspId, name, timestamp }}
      ]}).then(({ data, status }) => (status === 'OK' ? Object.values(data)[0] : null));
    }),
  DefineOrgUrl: async ({ mspId, payload: { url, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.entityMissing();
      return save({ events: [
        { type: 'OrgUrlDefined', payload: { mspId, url, timestamp }}
      ]}).then(({ data, status }) => (status === 'OK' ? Object.values(data)[0] : null));
    }),
  ShutdownOrg: async ({ mspId, payload: { timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (currentState)
        return save({ events: [
          { type: 'OrgDowned', payload: { mspId, timestamp }}
        ]}).then(({ data, status }) => (status === 'OK' ? Object.values(data)[0] : null));
    })
});
