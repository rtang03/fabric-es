import { Context, Contract, Transaction } from 'fabric-contract-api';
import { ChaincodeStub, newLogger } from 'fabric-shim';
import { omit } from 'lodash';
import {
  Commit,
  createInstance,
  makeKey,
  StateList,
  toRecord
} from '../ledger-api';

class MyContext extends Context {
  stateList?: StateList;
  stub: ChaincodeStub;
  constructor() {
    super();
    this.stateList = new StateList(this, 'entities');
  }
}

export class EventStore extends Contract {
  constructor(public context: MyContext = new Context()) {
    super('eventstore');
  }

  createContext() {
    return new MyContext();
  }

  @Transaction()
  async instantiate(ctx: MyContext) {
    const logger = newLogger('eventstore-logger');
    logger.info(
      '============= START : Initialize Entity Ledger V2 ==========='
    );
    // console.info(
    //   '============= START : Initialize Entity Ledger V2 ==========='
    // );
    const commits: Commit[] = [];
    commits.push(
      createInstance({
        id: 'ent_dev_1001',
        entityName: 'dev_entity',
        version: '0',
        events: [{ type: 'User Created', payload: { name: 'April' } }]
      })
    );
    commits.push(
      createInstance({
        id: 'ent_dev_1001',
        entityName: 'dev_entity',
        version: '0',
        events: [{ type: 'User Created', payload: { name: 'May' } }]
      })
    );

    for (const commit of commits) {
      await ctx.stateList.addState(commit);
    }
    console.info('============= END : Initialize Entity Ledger ===========');
    return Buffer.from(JSON.stringify(commits));
  }

  // async beforeTransaction(ctx) {
  //   console.log('===Calling beforeTransaction===');
  //   console.log(ctx.clientIdentity.getID());
  //   console.log(ctx.clientIdentity.getMSPID());
  //   console.log(ctx.clientIdentity.getX509Certificate().subject);
  //   console.log(ctx.clientIdentity.getX509Certificate().issuer);
  // }

  @Transaction()
  async createCommit(
    ctx: MyContext,
    entityName: string,
    id: string,
    version: string,
    eventStr: string
  ) {
    if (!id || !entityName || !eventStr || version === undefined)
      throw new Error('createCommit problem: null argument');

    console.log('===version===');
    console.log(version);
    if (version === '0') {
      console.log('---Create Commit before query---');
      const result = await ctx.stateList.getQueryResult([
        JSON.stringify(entityName),
        JSON.stringify(id)
      ]);
      console.log('---Create Commit after query---');
      console.log(result);
    }

    const events = JSON.parse(eventStr);
    const commit = createInstance({ id, version, entityName, events });
    await ctx.stateList.addState(commit);
    const evt: any = omit(commit, 'key');
    evt.entityId = evt.id;
    ctx.stub.setEvent('createCommit', Buffer.from(JSON.stringify(evt)));
    return Buffer.from(JSON.stringify(toRecord(omit(commit, 'key'))));
  }

  @Transaction(false)
  async queryByEntityName(ctx: MyContext, entityName: string) {
    if (!entityName)
      throw new Error('queryByEntityName problem: null argument');
    return await ctx.stateList.getQueryResult([JSON.stringify(entityName)]);
  }

  @Transaction(false)
  async queryByEntityId(ctx: MyContext, entityName: string, id: string) {
    if (!id || !entityName)
      throw new Error('queryByEntityId problem: null argument');
    return await ctx.stateList.getQueryResult([
      JSON.stringify(entityName),
      JSON.stringify(id)
    ]);
  }

  @Transaction(false)
  async queryByEntityIdCommitId(
    ctx: MyContext,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId)
      throw new Error('queryByEntityIdCommitId problem: null argument');
    const key = makeKey([entityName, id, commitId]);
    const commit = await ctx.stateList.getState(key);
    const result = {};
    if (commit && commit.commitId) {
      result[commit.commitId] = omit(commit, 'key');
    }
    return Buffer.from(JSON.stringify(result));
  }

  @Transaction()
  async deleteByEntityIdCommitId(
    ctx: MyContext,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId)
      throw new Error('deleteEntityByCommitId problem: null argument');
    const key = makeKey([entityName, id, commitId]);
    const commit = await ctx.stateList.getState(key);
    if (commit && commit.key) {
      await ctx.stateList.deleteState(commit).catch(err => {
        throw new Error(err);
      });
      return Buffer.from(
        JSON.stringify({
          status: 'SUCCESS',
          message: `Commit ${commit.commitId} is deleted`
        })
      );
    } else {
      return Buffer.from(
        JSON.stringify({
          status: 'SUCCESS',
          message: 'commitId does not exist'
        })
      );
    }
  }

  @Transaction()
  async deleteByEntityId(ctx: MyContext, entityName: string, id: string) {
    if (!id || !entityName)
      throw new Error('deleteByEntityId problem: null argument');
    return await ctx.stateList.deleteStateByEnityId([
      JSON.stringify(entityName),
      JSON.stringify(id)
    ]);
  }
}
