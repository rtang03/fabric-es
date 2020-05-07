import util from 'util';
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { omit } from 'lodash';
import { Commit, createInstance, isEventArray, makeKey, toRecord } from '../ledger-api';
import { MyContext } from './myContext';

@Info({
  title: 'smart contract for eventstore',
  description: 'smart contract for eventstore'
})
export class EventStore extends Contract {
  constructor(public context: MyContext = new Context()) {
    super('eventstore');
  }

  createContext() {
    return new MyContext();
  }

  @Transaction()
  @Returns('string')
  async Init(context: MyContext) {
    console.info('=== START : Initialize eventstore ===');

    const commits: Commit[] = [];

    commits.push(
      createInstance({
        id: 'ent_dev_1001',
        entityName: 'dev_entity',
        version: '0',
        events: [{ type: 'User Created', payload: { name: 'April' } }],
        commitId: '12345a'
      })
    );
    commits.push(
      createInstance({
        id: 'ent_dev_1001',
        entityName: 'dev_entity',
        version: '0',
        events: [{ type: 'User Created', payload: { name: 'May' } }],
        commitId: '12345b'
      })
    );

    for (const commit of commits) {
      await context.stateList.addState(commit);
    }

    console.info('=== END : Initialize eventstore ===');

    return 'Init Done';
  }

  @Transaction()
  @Returns('buffer')
  async createCommit(
    context: MyContext,
    entityName: string,
    id: string,
    version: string,
    eventStr: string,
    commitId: string
  ) {
    if (!id || !entityName || !eventStr || !commitId || version === undefined)
      throw new Error('createCommit problem: null argument');

    let events: unknown;
    let commit: Commit;

    try {
      events = JSON.parse(eventStr);
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to parse eventStr: %j', e));
    }

    if (isEventArray(events)) {
      commit = createInstance({
        id,
        version,
        entityName,
        events,
        commitId
      });
    } else throw new Error('eventStr is not correct format');

    // ///////////////////////////////////////////////////////////////////
    // Add the concept 'lifeCycle' to BaseEvent (../ledger-api/commit.ts)
    // lifeCycle == 0 - NORMAL event, no restriction
    // lifeCycle == 1 - BEGIN event, can only appear once at the begining of the event stream of an entity
    // lifeCycle == 2 - END event, can only appear once at the end of the event stream of an entity
    const lcBgn = events.findIndex(item => item.lifeCycle && (item.lifeCycle === 1));
    const lcEnd = events.findIndex(item => item.lifeCycle && (item.lifeCycle === 2));
    if ((lcBgn >= 0) || (lcEnd >= 0)) {
      if ((lcBgn >= 0) && (lcEnd >= 0) && (lcBgn >= lcEnd)) {
        // Both BEGIN and END events found in the stream, but in incorrect order (entity END before BEGIN)
        throw new Error(`Cannot end ${id} before starting`);
      }

      const rslt: Buffer = await context.stateList.getQueryResult([JSON.stringify(entityName), JSON.stringify(id)]);
      if (lcBgn >= 0) {
        if (rslt && (rslt.toString('utf8').includes(`"id":"${id}"`))) {
          // Attempt to BEGIN an entity with the same {id}
          throw new Error(`Lifecycle of ${id} already started`);
        }
      }

      if (lcEnd >= 0) {
        if (!rslt || (!rslt.toString('utf8').includes(`"id":"${id}"`))) {
          // Attempt to END an non-existing entity
          throw new Error(`Lifecycle of ${id} not started yet`);
        } else if (rslt.toString('utf8').includes('"lifeCycle":2')) {
          // Attempt to END an already ended entity
          throw new Error(`Lifecycle of ${id} already ended`);
        }
      }
    }
    // ///////////////////////////////////////////////////////////////////*/

    await context.stateList.addState(commit);

    console.info(`Submitter: ${context.clientIdentity.getID()} - createCommit`);

    const evt: any = omit(commit, 'key');
    evt.entityId = evt.id;

    context.stub.setEvent('createCommit', Buffer.from(JSON.stringify(evt)));

    return Buffer.from(JSON.stringify(toRecord(omit(commit, 'key', 'events'))));
  }

  @Transaction(false)
  async queryByEntityName(context: MyContext, entityName: string) {
    if (!entityName) throw new Error('queryByEntityName problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityName`);

    return context.stateList.getQueryResult([JSON.stringify(entityName)]);
  }

  @Transaction(false)
  async queryByEntityId(context: MyContext, entityName: string, id: string) {
    if (!id || !entityName) throw new Error('queryByEntityId problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityId`);

    return context.stateList.getQueryResult([JSON.stringify(entityName), JSON.stringify(id)]);
  }

  @Transaction(false)
  async queryByEntityIdCommitId(context: MyContext, entityName: string, id: string, commitId: string) {
    if (!id || !entityName || !commitId) throw new Error('queryByEntityIdCommitId problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityIdCommitId`);

    const key = makeKey([entityName, id, commitId]);
    const commit = await context.stateList.getState(key);
    const result = {};

    if (commit?.commitId) result[commit.commitId] = omit(commit, 'key');

    return Buffer.from(JSON.stringify(result));
  }

  @Transaction()
  async deleteByEntityIdCommitId(context: MyContext, entityName: string, id: string, commitId: string) {
    if (!id || !entityName || !commitId) throw new Error('deleteEntityByCommitId problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - deleteByEntityIdCommitId`);

    const key = makeKey([entityName, id, commitId]);
    const commit = await context.stateList.getState(key);

    if (commit?.key) {
      await context.stateList.deleteState(commit);
      return getSuccessMessage(`Commit ${commit.commitId} is deleted`);
    } else return getSuccessMessage('commitId does not exist');
  }

  @Transaction()
  async deleteByEntityId(context: MyContext, entityName: string, id: string) {
    if (!id || !entityName) throw new Error('deleteByEntityId problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - deleteByEntityId`);

    return context.stateList.deleteStateByEnityId([JSON.stringify(entityName), JSON.stringify(id)]);
  }
}

const getErrorMessage = method =>
  Buffer.from(
    JSON.stringify({
      status: 'ERROR',
      message: `${method} fails`
    })
  );

const getSuccessMessage = message =>
  Buffer.from(
    JSON.stringify({
      status: 'SUCCESS',
      message
    })
  );
