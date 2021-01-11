import { Commit, EventStore } from '..';
import { StateList } from '../ledger-api';

const ctx: any = {
  stub: {
    createCompositeKey: jest.fn(),
    deleteState: jest.fn(),
    getState: jest.fn(),
    putState: jest.fn(),
    setEvent: jest.fn(),
    getStateByPartialCompositeKey: jest.fn(),
    getCreator: jest.fn()
  },
  clientIdentity: { getID: jest.fn() }
};
const context = {
  stateList: new StateList(ctx, 'entities'),
  ...ctx
};

const cc = new EventStore(context);

describe('Create commit with normal events', () => {
  const entityName = 'cc_test';
  const id = 'cc_01';
  const version = '0';
  const events = [{ type: 'mon', payload: { name: 'jun' } }];
  const commitId = '123';

  beforeAll(() => {
    ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
    ctx.stub.putState.mockResolvedValue(Buffer.from(''));
    ctx.stub.setEvent.mockImplementation((name, args) => console.log(`Event sent: ${name}: ${args}`));
    ctx.stub.getCreator.mockImplementation(() => { return { 'mspid': 'Org1MSP' }; });
    ctx.clientIdentity.getID.mockImplementation(() => 'Org1MSP');

    const value = JSON.stringify({
      key: '12345',
      commitId, committedAt: '2019', version,
      entityName, id, entityId: id, events
    });
    
    ctx.stub.getStateByPartialCompositeKey.mockImplementation(() => {
      let counter = 1;
      return {
        [Symbol.asyncIterator]: () => ({
          next: () => {
            if (counter > 0) {
              counter--;
              return Promise.resolve({ value: { value }, done: false });
            } else return Promise.resolve({ done: true });
          }})};
    });
    ctx.stub.getState.mockResolvedValue(value);
  });

  it('should instantiate', async () => cc.Init(context).then(response => expect(response).toEqual('Init Done')));

  it('should createCommit', async () =>
    cc.createCommit(context, entityName, id, version, JSON.stringify(events), commitId)
      .then((response: any) => JSON.parse(response)[commitId])
      .then(result => expect((result.entityId === id) && (result.entityName === entityName)).toBeTruthy()));
});

describe('Create commit with lifecycle starting events', () => {
  const entityName = 'cc_test';
  const id = 'cc_02';
  const version = '0';
  const events = [{ type: 'mon', lifeCycle: 1, payload: { name: 'jun' } }];
  const commitId = '124';

  beforeAll(() => {
    ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
    ctx.stub.putState.mockResolvedValue(Buffer.from(''));
    ctx.stub.setEvent.mockImplementation((name, args) => console.log(`Event sent: ${name}: ${args}`));
    ctx.clientIdentity.getID.mockImplementation(() => 'Org1MSP');

    const value = JSON.stringify({
      key: '12346',
      commitId, committedAt: '2019', version,
      entityName, id, entityId: id, events
    });

    ctx.stub.getStateByPartialCompositeKey.mockImplementation(() => {
      let counter = 1;
      return {
        [Symbol.asyncIterator]: () => ({
          next: () => {
            if (counter > 0) {
              counter--;
              return Promise.resolve({ value: { value }, done: false });
            } else return Promise.resolve({ done: true });
          }})};
    });
    ctx.stub.getState.mockResolvedValue(value);
  });

  it('should instantiate', async () => cc.Init(context).then(response => expect(response).toEqual('Init Done')));

  it('should reject create', async () => {
    expect.assertions(1);
    return cc.createCommit(context, entityName, id, version, JSON.stringify(events), commitId)
      .catch((error: Error) => expect(error.message).toBe(`Lifecycle of ${id} already started`)
    );
  });
});

describe('Create commit with lifecycle ending events', () => {
  const entityName = 'cc_test';
  const id = 'cc_03';
  const version = '0';
  const events = [{ type: 'mon', lifeCycle: 2, payload: { name: 'jun' } }];
  const commitId = '125';

  beforeAll(() => {
    ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
    ctx.stub.putState.mockResolvedValue(Buffer.from(''));
    ctx.stub.setEvent.mockImplementation((name, args) => console.log(`Event sent: ${name}: ${args}`));
    ctx.clientIdentity.getID.mockImplementation(() => 'Org1MSP');

    const value = JSON.stringify({
      key: '12347',
      commitId, committedAt: '2019', version,
      entityName, id, entityId: id, events
    });

    ctx.stub.getStateByPartialCompositeKey.mockImplementation(() => {
      let counter = 1;
      return {
        [Symbol.asyncIterator]: () => ({
          next: () => {
            if (counter > 0) {
              counter--;
              return Promise.resolve({ value: { value }, done: false });
            } else return Promise.resolve({ done: true });
          }})};
    });
    ctx.stub.getState.mockResolvedValue(value);
  });

  it('should instantiate', async () => cc.Init(context).then(response => expect(response).toEqual('Init Done')));

  it('should reject create', async () => {
    expect.assertions(1);
    return cc.createCommit(context, entityName, id, version, JSON.stringify(events), commitId)
      .catch((error: Error) => expect(error.message).toBe(`Lifecycle of ${id} already ended`)
    );
  });
});

describe('Create commit with lifecycle starting and ending events', () => {
  const entityName = 'cc_test';
  const id = 'cc_04';
  const version = '0';
  const events = [
    { type: 'mon', lifeCycle: 1, payload: { name: 'jan' }},
    { type: 'yer', lifeCycle: 2, payload: { name: 'dec' }}
  ];
  const commitId = '126';

  beforeAll(() => {
    ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
    ctx.stub.putState.mockResolvedValue(Buffer.from(''));
    ctx.stub.setEvent.mockImplementation((name, args) => console.log(`Event sent: ${name}: ${args}`));
    ctx.clientIdentity.getID.mockImplementation(() => 'Org1MSP');
  });

  it('should instantiate', async () => cc.Init(context).then(response => expect(response).toEqual('Init Done')));

  it('should create commit', async () => {
    expect.assertions(1);
    return cc.createCommit(context, entityName, id, version, JSON.stringify(events), commitId)
      .catch((error: Error) => expect(error.message).toBe(`Lifecycle of ${id} not started yet`)
    );
  });
});

describe('Create commit with lifecycle ending then starting events', () => {
  const entityName = 'cc_test';
  const id = 'cc_05';
  const version = '0';
  const events = [
    { type: 'mon', lifeCycle: 2, payload: { name: 'jan' }},
    { type: 'yer', lifeCycle: 1, payload: { name: 'dec' }}
  ];
  const commitId = '127';

  beforeAll(() => {
    ctx.stub.createCompositeKey.mockResolvedValue('entities"en""entId""2019"');
    ctx.stub.putState.mockResolvedValue(Buffer.from(''));
    ctx.stub.setEvent.mockImplementation((name, args) => console.log(`Event sent: ${name}: ${args}`));
    ctx.clientIdentity.getID.mockImplementation(() => 'Org1MSP');
  });

  it('should instantiate', async () => cc.Init(context).then(response => expect(response).toEqual('Init Done')));

  it('should create commit', async () => {
    expect.assertions(1);
    return cc.createCommit(context, entityName, id, version, JSON.stringify(events), commitId)
      .catch((error: Error) => expect(error.message).toBe(`Cannot end ${id} before starting`)
    );
  });
});
