require('../../env');
import { pick } from 'lodash';
import { bootstrapNetwork } from '../../account';
import { Counter, CounterEvent, reducer } from '../../example';
import { Commit, Peer, PrivatedataRepository } from '../../types';
import { createProjectionDb } from '../createProjectionDb';
import { createQueryDatabase } from '../createQueryDatabase';
import { createPeer } from '../peer';

let peer: Peer;
let repo: PrivatedataRepository;
const entityName = 'privatedata_counter';
const enrollmentId = `peer_privatedata${Math.floor(Math.random() * 1000)}`;
let commitId: string;

beforeAll(async () => {
  const context = await bootstrapNetwork({
    enrollmentId,
    enrollmentSecret: 'password'
  });
  peer = createPeer({
    ...context,
    defaultReducer: reducer,
    defaultEntityName: entityName,
    queryDatabase: createQueryDatabase(),
    projectionDb: createProjectionDb(entityName),
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
    repo
      .create({ enrollmentId, id: enrollmentId })
      .save([{ type: 'ADD' }])
      .then((commit: Commit) => {
        commitId = commit.commitId;
        expect(
          pick(commit, 'version', 'entityName')
        ).toMatchSnapshot();
      }));

  it('should getByEntityName', async () =>
    repo
      .getByEntityName()
      .then(({ data }) => expect(data).toEqual([{ value: 1 }])));

  it('should getById', async () =>
    repo
      .getById({ enrollmentId, id: enrollmentId })
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1 })));

  it('should deleteByEntityIdCommitId', async () =>
    repo
      .deleteByEntityIdCommitId(enrollmentId, commitId)
      .then(({ status }) => expect(status).toBe('SUCCESS')));
});
