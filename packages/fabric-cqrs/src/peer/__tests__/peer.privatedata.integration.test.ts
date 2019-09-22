import { pick } from 'lodash';
import { Counter, CounterEvent, reducer } from '../../example';
import { getNetwork } from '../../services';
import { Commit, PrivatedataRepository } from '../../types';
import { Peer } from '../peer';
import { projectionDb, queryDatabase } from './__utils__';

let peer: Peer;
let repo: PrivatedataRepository;
const entityName = 'privatedata_counter';
const id = 'peer_privatedata_test_01';
let commitId: string;

beforeAll(async () => {
  const networkConfig = await getNetwork();
  peer = new Peer({
    ...networkConfig,
    reducer,
    queryDatabase,
    projectionDb,
    collection: 'Org1PrivateDetails'
  });
  repo = peer.getPrivateDataRepo<Counter, CounterEvent>({
    entityName,
    reducer
  });
});

afterAll(async () => peer.disconnect());

describe('Start peer privatedata Tests', () => {
  it('should Add #1', async () =>
    await repo
      .create(id)
      .save([{ type: 'ADD' }])
      .then((commit: Commit) => {
        commitId = commit.commitId;
        expect(
          pick(commit, 'id', 'version', 'entityName', 'events')
        ).toMatchSnapshot();
      }));

  it('should getByEntityName', async () =>
    await repo
      .getByEntityName()
      .then(({ entities }) => expect(entities).toEqual([{ value: 1 }])));

  it('should getById', async () =>
    await repo
      .getById(id)
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1 })));

  it('should deleteByEntityIdCommitId', async () =>
    await repo
      .deleteByEntityIdCommitId(id, commitId)
      .then(result => expect(result[commitId]).toEqual({})));
});
