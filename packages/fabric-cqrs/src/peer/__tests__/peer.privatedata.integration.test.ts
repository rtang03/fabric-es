import { pick } from 'lodash';
import { registerUser } from '../../account/registerUser';
import { Counter, CounterEvent, reducer } from '../../example';
import { getNetwork } from '../../services';
import { Commit, PrivatedataRepository } from '../../types';
import { Peer } from '../peer';
import { projectionDb, queryDatabase } from './__utils__';

let peer: Peer;
let repo: PrivatedataRepository;
const entityName = 'privatedata_counter';
const identity = `peer_privatedata${Math.floor(Math.random() * 1000)}`;
let commitId: string;

beforeAll(async () => {
  try {
    await registerUser({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    const context = await getNetwork({ identity });
    peer = new Peer({
      ...context,
      reducer,
      queryDatabase,
      projectionDb,
      collection: 'Org1PrivateDetails'
    });
    repo = peer.getPrivateDataRepo<Counter, CounterEvent>({
      entityName,
      reducer
    });
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => peer.disconnect());

describe('Start peer privatedata Tests', () => {
  it('should Add #1', async () =>
    await repo
      .create(identity)
      .save([{ type: 'ADD' }])
      .then((commit: Commit) => {
        commitId = commit.commitId;
        expect(
          pick(commit, 'version', 'entityName', 'events')
        ).toMatchSnapshot();
      }));

  it('should getByEntityName', async () =>
    await repo
      .getByEntityName()
      .then(({ entities }) => expect(entities).toEqual([{ value: 1 }])));

  it('should getById', async () =>
    await repo
      .getById(identity)
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1 })));

  it('should deleteByEntityIdCommitId', async () =>
    await repo
      .deleteByEntityIdCommitId(identity, commitId)
      .then(({ status }) => expect(status).toBe('SUCCESS')));
});
