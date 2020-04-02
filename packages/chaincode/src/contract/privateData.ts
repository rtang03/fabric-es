import util from 'util';
import { hash } from 'bcrypt';
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { omit } from 'lodash';
import { Commit, createInstance, isEventArray, makeKey, PrivateStateList, toRecord } from '../ledger-api';

class MyContext extends Context {
  stateList?: PrivateStateList;
  stub: ChaincodeStub;
  constructor() {
    super();
    this.stateList = new PrivateStateList(this, 'entities');
  }
}

/**
 * see https://hyperledger-fabric.readthedocs.io/en/release-2.0/private-data-arch.html
 */
@Info({
  title: 'smart contract for privatedata',
  description: 'smart contract for privatedata'
})
export class PrivateData extends Contract {
  constructor(public context: MyContext = new Context()) {
    super('privatedata');
  }

  createContext() {
    return new MyContext();
  }

  @Transaction()
  @Returns('string')
  async Init(context: MyContext) {
    console.info('=========== START : Initialize PrivateData =========');
    console.info('============= END : Initialize PrivateData ===========');
    return 'Init Done';
  }

  /**
   * createCommit create commit for private data
   * @param context context for Chaincode stub
   * @param entityName entityName
   * @param id id or entityId
   * @param version version
   * @param commitId commitId
   */
  @Transaction()
  @Returns('bytebuffer')
  async createCommit(context: MyContext, entityName: string, id: string, version: string, commitId: string) {
    if (!id || !version || !entityName || !commitId)
      throw new Error('createCommit: null argument: id, version, entityName, collection');

    const collection = `_implicit_org_${context.clientIdentity.getMSPID()}`;
    console.info(`Submitter: ${context.clientIdentity.getID()} - createCommit`);

    let transientMap: Map<string, Uint8Array>;

    try {
      transientMap = context.stub.getTransient();
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to get transient map: %j', e));
    }

    if (!transientMap) throw new Error('Error getting transient map');

    let events: unknown;
    let eventStr: string;
    let commit: Commit;

    try {
      eventStr = transientMap.get('eventstr').toString();
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to get eventstr from transient map: %j', e));
    }

    try {
      events = JSON.parse(eventStr);
    } catch (e) {
      console.error(e);
      throw new Error(util.format('fail to parse transient data: %j', e));
    }

    // ensure transient data is correct shape
    if (isEventArray(events)) {
      commit = createInstance({
        id,
        version,
        entityName,
        events,
        commitId
      });
    } else throw new Error('transient data is not correct format');

    console.info(`CommitId created: ${commit.commitId}`);

    // protect private data content with salt
    // @see https://www.npmjs.com/package/bcrypt
    commit.hash = await hash(JSON.stringify(events), 8);

    await context.stateList.addState(collection, commit);

    return Buffer.from(JSON.stringify(toRecord(omit(commit, 'key', 'events'))));
  }

  /**
   * queryByEntityName query commits by entityName
   * @param context context for Chaincode stub
   * @param entityName entityName
   */
  @Transaction(false)
  async queryByEntityName(context: MyContext, entityName: string) {
    if (!entityName) throw new Error('queryPrivateDataByEntityName problem: null argument');

    const collection = `_implicit_org_${context.clientIdentity.getMSPID()}`;

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityName`);

    return await context.stateList.getQueryResult(collection, [JSON.stringify(entityName)]);
  }

  /**
   * queryByEntityId query commit by entityId
   * @param context context for Chaincode stub
   * @param entityName entityName
   * @param id entityId or id
   */
  @Transaction(false)
  async queryByEntityId(context: MyContext, entityName: string, id: string) {
    if (!id || !entityName) throw new Error('queryPrivateDataByEntityId problem: null argument');

    const collection = `_implicit_org_${context.clientIdentity.getMSPID()}`;

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityId`);

    return await context.stateList.getQueryResult(collection, [JSON.stringify(entityName), JSON.stringify(id)]);
  }

  /**
   * queryByEntityIdCommitId query commit by entityId and commitId
   * @param context context for Chaincode stub
   * @param entityName entityName
   * @param id entityId or id
   * @param commitId commitId
   */
  @Transaction(false)
  async queryByEntityIdCommitId(context: MyContext, entityName: string, id: string, commitId: string) {
    if (!id || !entityName || !commitId) throw new Error('getPrivateData problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - queryByEntityIdCommitId`);

    const collection = `_implicit_org_${context.clientIdentity.getMSPID()}`;
    const key = makeKey([entityName, id, commitId]);
    const commit = await context.stateList.getState(collection, key);
    const result = {};

    if (commit?.commitId) result[commit.commitId] = omit(commit, 'key');

    return Buffer.from(JSON.stringify(result));
  }

  /**
   * deleteByEntityIdCommitId delete commit by EntityId and commitId
   * @param context
   * @param entityName entityName
   * @param id entityId or id
   * @param commitId commitId
   */
  @Transaction()
  async deleteByEntityIdCommitId(context: MyContext, entityName: string, id: string, commitId: string) {
    if (!id || !entityName || !commitId) throw new Error('deletePrivateDataByEntityIdCommitId problem: null argument');

    console.info(`Submitter: ${context.clientIdentity.getID()} - deleteByEntityIdCommitId`);

    const collection = `_implicit_org_${context.clientIdentity.getMSPID()}`;
    const key = makeKey([entityName, id, commitId]);

    let commit;

    try {
      commit = await context.stateList.getState(collection, key);
    } catch (e) {
      console.error(e);
    }

    if (commit?.key) {
      await context.stateList.deleteState(collection, commit);
      return Buffer.from(
        JSON.stringify({
          status: 'SUCCESS',
          message: `Commit ${commit.commitId} is deleted`
        })
      );
    } else {
      throw new Error('commitId does not exist');
    }
  }
}
