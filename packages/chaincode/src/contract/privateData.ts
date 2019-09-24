import { Context, Contract } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { omit } from 'lodash';
import {
  createInstance,
  makeKey,
  PrivateStateList,
  toRecord
} from '../ledger-api';

class MyContext extends Context {
  stateList?: PrivateStateList;
  stub: ChaincodeStub;
  constructor() {
    super();
    this.stateList = new PrivateStateList(this, 'entities');
  }
}

export class PrivateData extends Contract {
  constructor(public context: MyContext = new Context()) {
    super('privatedata');
  }

  createContext() {
    return new MyContext();
  }

  async instantiate(ctx: MyContext) {
    console.info('=========== START : Initialize PrivateData =========');
    console.info('============= END : Initialize PrivateData ===========');
  }

  async createCommit(
    { stub, stateList }: MyContext,
    collection: string,
    entityName: string,
    id: string,
    version: string
  ) {
    if (!id || !version || !entityName || !collection)
      throw new Error(
        'createCommit: null argument: id, version, entityName, collection'
      );
    const transientMap = stub.getTransient();
    if (!transientMap) throw new Error('Error getting transient');

    // @ts-ignore
    const byteBuffer: ByteBuffer = transientMap.get('eventstr');
    const eventStr = Buffer.from(byteBuffer.toArrayBuffer()).toString();
    const events = JSON.parse(eventStr);
    const commit = createInstance({ id, version, entityName, events });
    console.log('CommitId created:');
    console.log(commit.commitId);
    await stateList.addState(collection, commit);
    return Buffer.from(JSON.stringify(toRecord(omit(commit, 'key'))));
  }

  async queryByEntityName(
    ctx: MyContext,
    collection: string,
    entityName: string
  ) {
    if (!entityName)
      throw new Error('queryPrivateDataByEntityName problem: null argument');
    return await ctx.stateList.getQueryResult(collection, [
      JSON.stringify(entityName)
    ]);
  }

  async queryByEntityId(
    ctx: MyContext,
    collection: string,
    entityName: string,
    id: string
  ) {
    if (!id || !entityName || !collection)
      throw new Error('queryPrivateDataByEntityId problem: null argument');
    return await ctx.stateList.getQueryResult(collection, [
      JSON.stringify(entityName),
      JSON.stringify(id)
    ]);
  }

  async queryByEntityIdCommitId(
    ctx: MyContext,
    collection: string,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId)
      throw new Error('getPrivateData problem: null argument');
    const key = makeKey([entityName, id, commitId]);
    const commit = await ctx.stateList.getState(collection, key);
    const result = {};
    if (commit && commit.commitId) {
      result[commit.commitId] = omit(commit, 'key');
    }
    return Buffer.from(JSON.stringify(result));
  }

  async deleteByEntityIdCommitId(
    ctx: MyContext,
    collection: string,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId || !collection)
      throw new Error(
        'deletePrivateDataByEntityIdCommitId problem: null argument'
      );
    const key = makeKey([entityName, id, commitId]);
    const commit = await ctx.stateList.getState(collection, key);
    if (commit && commit.key) {
      await ctx.stateList.deleteState(collection, commit).catch(err => {
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
}
