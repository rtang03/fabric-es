import { hash } from 'bcrypt';
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

  async instantiate(context: MyContext) {
    const logger = context.logging.getLogger('instantiate');
    logger.info('=========== START : Initialize PrivateData =========');
    logger.info('============= END : Initialize PrivateData ===========');
  }

  async createCommit(
    context: MyContext,
    collection: string,
    entityName: string,
    id: string,
    version: string
  ) {
    if (!id || !version || !entityName || !collection)
      throw new Error(
        'createCommit: null argument: id, version, entityName, collection'
      );
    const logger = context.logging.getLogger('createCommit');
    logger.info(`Submitter: ${context.clientIdentity.getID()}`);
    const transientMap = context.stub.getTransient();
    if (!transientMap) throw new Error('Error getting transient');

    // @ts-ignore
    const byteBuffer: ByteBuffer = transientMap.get('eventstr');
    const eventStr = Buffer.from(byteBuffer.toArrayBuffer()).toString();
    const events = JSON.parse(eventStr);
    const commit = createInstance({ id, version, entityName, events });
    logger.info(`CommitId created: ${commit.commitId}`);
    await context.stateList.addState(collection, commit);
    (commit as any).hash = hash(events, 12);
    return Buffer.from(JSON.stringify(toRecord(omit(commit, 'key', 'events'))));
  }

  async queryByEntityName(
    context: MyContext,
    collection: string,
    entityName: string
  ) {
    if (!entityName)
      throw new Error('queryPrivateDataByEntityName problem: null argument');
    const logger = context.logging.getLogger('queryByEntityName');
    logger.info(`Submitter: ${context.clientIdentity.getID()}`);
    return await context.stateList.getQueryResult(collection, [
      JSON.stringify(entityName)
    ]);
  }

  async queryByEntityId(
    context: MyContext,
    collection: string,
    entityName: string,
    id: string
  ) {
    if (!id || !entityName || !collection)
      throw new Error('queryPrivateDataByEntityId problem: null argument');
    const logger = context.logging.getLogger('queryByEntityId');
    logger.info(`Submitter: ${context.clientIdentity.getID()}`);
    return await context.stateList.getQueryResult(collection, [
      JSON.stringify(entityName),
      JSON.stringify(id)
    ]);
  }

  async queryByEntityIdCommitId(
    context: MyContext,
    collection: string,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId)
      throw new Error('getPrivateData problem: null argument');
    const logger = context.logging.getLogger('queryByEntityIdCommitId');
    logger.info(`Submitter: ${context.clientIdentity.getID()}`);
    const key = makeKey([entityName, id, commitId]);
    const commit = await context.stateList.getState(collection, key);
    const result = {};
    if (commit && commit.commitId) {
      result[commit.commitId] = omit(commit, 'key');
    }
    return Buffer.from(JSON.stringify(result));
  }

  async deleteByEntityIdCommitId(
    context: MyContext,
    collection: string,
    entityName: string,
    id: string,
    commitId: string
  ) {
    if (!id || !entityName || !commitId || !collection)
      throw new Error(
        'deletePrivateDataByEntityIdCommitId problem: null argument'
      );
    const logger = context.logging.getLogger('deleteByEntityIdCommitId');
    logger.info(`Submitter: ${context.clientIdentity.getID()}`);
    const key = makeKey([entityName, id, commitId]);
    const commit = await context.stateList.getState(collection, key);
    if (commit && commit.key) {
      await context.stateList.deleteState(collection, commit).catch(err => {
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
