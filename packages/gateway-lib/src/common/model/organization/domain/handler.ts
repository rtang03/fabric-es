import { OrgCommandHandler, OrgRepo } from '..';
import { Errors } from '../../../..';
import { OrgEvents } from './events';
import { OrgStatus } from './model';

/**
 * @about command handler for organization
 * @param enrollmentId
 * @param orgRepo
 */
export const orgCommandHandler: (option: {
  enrollmentId: string;
  orgRepo: OrgRepo;
}) => OrgCommandHandler = ({ enrollmentId, orgRepo }) => ({
  StartOrg: async ({ mspId, payload: { name, url, timestamp }}) => {
    const { currentState, save } = await orgRepo.getById({ enrollmentId, id: mspId });
    let events: OrgEvents[];

    if (currentState) {
      events = [{ type: 'OrgStarted', payload: { mspId, timestamp }}];
      if (name && name !== currentState.name) events.push({ type: 'OrgNameDefined', payload: { mspId, name, timestamp }});
      if (url && url !== currentState.url) events.push({ type: 'OrgUrlDefined', payload: { mspId, url, timestamp }});
      return save({ events }).then(({ data }) => data);
    } else {
      if (!name) throw Errors.requiredDataMissing();
      events = [
        { type: 'OrgStarted', payload: { mspId, timestamp }},
        { type: 'OrgNameDefined', payload: { mspId, name, timestamp }},
      ];
      if (url) events.push({ type: 'OrgUrlDefined', payload: { mspId, url, timestamp }});
      return orgRepo
        .create({ enrollmentId, id: mspId }) // TODO HERE Fix also - add "id" to reducer output
        .save({ events })
        .then(({ data }) => data);
    }
  },
  DefineOrgName: async ({ mspId, payload: { name, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.entityMissing();
      if (!name) throw Errors.requiredDataMissing();
      return save({
        events: [{ type: 'OrgNameDefined', payload: { mspId, name, timestamp }}],
      }).then(({ data }) => data);
    }),
  DefineOrgUrl: async ({ mspId, payload: { url, timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (!currentState) throw Errors.entityMissing();
      return save({ events: [{ type: 'OrgUrlDefined', payload: { mspId, url, timestamp }}]}).then(
        ({ data }) => data
      );
    }),
  ShutdownOrg: async ({ mspId, payload: { timestamp }}) =>
    orgRepo.getById({ enrollmentId, id: mspId }).then(({ currentState, save }) => {
      if (currentState)
        return save({ events: [{ type: 'OrgDowned', payload: { mspId, timestamp }}]}).then(
          ({ data }) => data
        );
    }),
});
