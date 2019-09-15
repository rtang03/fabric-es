import { values } from 'lodash';
import { Commit, EventStore } from '..';
import { StateList } from '../ledger-api';

const ctx: any = {
  stub: {
    createCompositeKey: jest.fn(),
    deleteState: jest.fn(),
    getState: jest.fn(),
    putState: jest.fn(),
    setEvent: jest.fn(),
    getStateByPartialCompositeKey: jest.fn()
  }
};
const context = {
  stateList: new StateList(ctx, 'entities'),
  ...ctx
};

ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
ctx.stub.putState.mockResolvedValue(Buffer.from(''));
ctx.stub.setEvent.mockImplementation((name, args) =>
  console.log(`Event sent: ${name}: ${args}`)
);
const cc = new EventStore(context);
const entityName = 'cc_test';
const id = 'cc_01';
const entityId = id;
const version = '0';
const events = [{ type: 'mon', payload: { name: 'jun' } }];
const eventStr = JSON.stringify(events);
const commitId = '123';
const committedAt = '2019';
const value = JSON.stringify({
  key: '123', // any non-null string
  commitId,
  committedAt,
  version,
  entityName,
  id,
  entityId,
  events
});
ctx.stub.getStateByPartialCompositeKey.mockResolvedValue({
  next: () => ({ value: { value }, done: true }),
  close: () => null
});
ctx.stub.getState.mockResolvedValue(value);

describe('Chaincode Tests', () => {
  it('should instantiate', async () =>
    await cc
      .instantiate(context)
      .then<any[]>((response: any) => JSON.parse(response))
      .then(json =>
        json
          .map(({ id, entityName, version, events }) => ({
            id,
            entityName,
            version,
            events
          }))
          .map(commit => expect(commit).toMatchSnapshot())
      ));

  it('should createCommit', async () =>
    await cc
      .createCommit(context, entityName, id, version, eventStr)
      .then<Commit>((response: any) => values(JSON.parse(response))[0])
      .then(({ id, entityName, version, entityId, events }) => ({
        id,
        entityName,
        version,
        entityId,
        events
      }))
      .then(commit => expect(commit).toMatchSnapshot()));

  it('should queryByEntityName', async () =>
    await cc
      .queryByEntityName(context, entityName)
      .then<Record<string, Commit>>((response: any) => JSON.parse(response))
      .then(response => expect(response).toMatchSnapshot()));

  it('should queryByEntityId', async () =>
    await cc
      .queryByEntityId(context, entityName, id)
      .then<Record<string, Commit>>((response: any) => JSON.parse(response))
      .then(response => expect(response).toMatchSnapshot()));

  it('should queryByEntityIdCommitId', async () =>
    await cc
      .queryByEntityIdCommitId(context, entityName, id, commitId)
      .then<Record<string, Commit>>((response: any) => JSON.parse(response))
      .then(response => expect(response).toMatchSnapshot()));

  it('should deleteByEntityIdCommitId', async () =>
    await cc
      .deleteByEntityIdCommitId(context, entityName, id, commitId)
      .then<Record<string, Commit>>((response: any) => JSON.parse(response))
      .then(response => expect(response).toMatchSnapshot()));

  it('should deleteByEntityId', async () =>
    await cc
      .deleteByEntityId(context, entityName, id)
      .then<Record<string, Commit>>((response: any) => JSON.parse(response))
      .then(response => expect(response).toMatchSnapshot()));
});
