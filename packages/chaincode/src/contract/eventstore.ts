import { Context, Contract, Transaction } from 'fabric-contract-api';
import { isEqual, omit } from 'lodash';
import { Commit, createInstance, makeKey, toRecord } from '../ledger-api';
import {
  createPolicy,
  createResource,
  NAMESPACE,
  ngacRepo,
  permissionCheck
} from '../ngac';
import { createMSPResource } from '../ngac/utils/createMSPResource';
import { MyContext } from './myContext';

export class EventStore extends Contract {
  constructor(public context: MyContext = new Context()) {
    super('eventstore');
  }

  createContext() {
    return new MyContext();
  }

  @Transaction()
  async instantiate(context: MyContext) {
    console.log('=== START : Initialize eventstore ===');
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
      await context.stateList.addState(commit);
    }
    console.log('=== END : Initialize eventstore ===');
    console.log('=== START : Initialize ngac ===');
    await ngacRepo(context).addPolicy(
      createPolicy({
        context,
        policyClass: 'int-test',
        sid: 'allowCreateTest',
        allowedEvents: ['TestCreated'],
        uri: `${NAMESPACE.MODEL}/Org1MSP/test/test_0001`
      })
    );
    await ngacRepo(context).addMSPAttr(
      createMSPResource({
        mspId: 'Org1MSP',
        mspAttrs: [{ type: '1', key: 'mspid', value: 'Org1MSP' }],
        context
      })
    );
    await ngacRepo(context).addResourceAttr(
      createResource({
        context,
        entityName: 'ngactest',
        resourceAttrs: [
          {
            type: '1',
            key: 'createTest',
            value: [context.clientIdentity.getID()]
          }
        ]
      })
    );
    console.log('=== END : Initialize ngac ===');
    return Buffer.from(JSON.stringify(commits));
  }

  async beforeTransaction(context) {
    const mspId = context.clientIdentity.getMSPID();
    if (mspId !== 'Org1MSP') {
      console.log('---Permission is being checked---');
      await permissionCheck(context).then(assertions => {
        if (assertions === [])
          console.error('The submmited event does not in any policy statement');
        // throw new Error(
        //   'The submmited event does not in any policy statement'
        // );

        // Current strategy design: all corresponding policy statement must assert true;
        assertions.forEach(({ sid, assertion }) => {
          // if (!assertion) throw new Error(`Policy ${sid} fail`);
          console.log(`${sid} is asserted: ${assertion}`);
        });
      });
    }
  }

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
    if (version === '0') {
      const result = await ctx.stateList.getQueryResult(
        [JSON.stringify(entityName), JSON.stringify(id)],
        true
      );
      if (!isEqual(result, {})) {
        return getErrorMessage('createCommit');
      }
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
      return getSuccessMessage(`Commit ${commit.commitId} is deleted`);
    } else {
      return getSuccessMessage('commitId does not exist');
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

  // NGAC calls
  @Transaction()
  async addPolicy(
    context: MyContext,
    policyClass: string,
    sid: string,
    uri: string,
    eventsStr: string,
    conditionStr?: string
  ) {
    if (!policyClass || !sid || !uri || !eventsStr)
      throw new Error('addPolicy problem: null argument');
    const allowedEvents = JSON.parse(eventsStr);
    const condition = conditionStr ? JSON.parse(conditionStr) : null;
    const policy = await ngacRepo(context).addPolicy(
      createPolicy({
        context,
        policyClass,
        sid,
        allowedEvents,
        uri,
        condition
      })
    );
    return policy
      ? Buffer.from(JSON.stringify(policy))
      : getErrorMessage('addPolicy');
  }

  @Transaction()
  async addMSPAttr(context: MyContext, mspId: string, mspAttrsStr: string) {
    if (!mspId || !mspAttrsStr)
      throw new Error('addMSPAttr problem: null argument');
    const mspAttrs = JSON.parse(mspAttrsStr);
    const attributes = await ngacRepo(context).addMSPAttr(
      createMSPResource({ context, mspId, mspAttrs })
    );
    return attributes
      ? Buffer.from(JSON.stringify(attributes))
      : getErrorMessage('addMSPAttr');
  }

  @Transaction()
  async addResourceAttr(
    context: MyContext,
    entityName: string,
    entityId: string,
    resourceAttrsStr: string
  ) {
    if (!entityName || !resourceAttrsStr)
      throw new Error('addResourceAttr problem: null argument');
    const resourceAttrs = JSON.parse(resourceAttrsStr);
    const attributes = await ngacRepo(context).addResourceAttr(
      createResource({ context, entityName, entityId, resourceAttrs })
    );
    return attributes
      ? Buffer.from(JSON.stringify(attributes))
      : getErrorMessage('addResourceAttr');
  }

  @Transaction()
  async deleteMSPAttrByMSPID(context: MyContext, mspId: string) {
    if (!mspId) throw new Error('deleteMSPAttrByMSPID problem: null argument');
    const msp = await ngacRepo(context).deleteMSPAttrByMSPID(mspId);
    return msp
      ? getSuccessMessage(`${mspId} is successfully deleted`)
      : getErrorMessage('deleteMSPAttrByMSPID');
  }

  @Transaction()
  async deletePolicyById(context: MyContext, x509id: string) {
    if (!x509id) throw new Error('deletePolicyById problem: null argument');
    const policies = await ngacRepo(context).deletePolicyById(x509id);
    return policies
      ? getSuccessMessage(`${policies.length} record(s) is deleted`)
      : getErrorMessage('deletePolicyById');
  }

  @Transaction()
  async deletePolicyByIdSid(context: MyContext, x509id: string, sid: string) {
    if (!x509id || !sid)
      throw new Error('deletePolicyByIdSid problem: null argument');
    const keyDeleted = await ngacRepo(context).deletePolicyByIdSid(x509id, sid);
    return keyDeleted
      ? getSuccessMessage(`${keyDeleted} is deleted`)
      : getErrorMessage('deletePolicyByIdSid');
  }

  @Transaction()
  async deleteReourceAttrByURI(context: MyContext, uri: string) {
    if (!uri) throw new Error('deleteReourceAttrByURI problem: null argument');
    const keyDeleted = await ngacRepo(context).deleteReourceAttrByURI(uri);
    return keyDeleted
      ? getSuccessMessage(`${keyDeleted} is deleted`)
      : getErrorMessage('deleteReourceAttrByURI');
  }

  @Transaction()
  async upsertResourceAttr(
    context: MyContext,
    entityName: string,
    entityId: string,
    resourceAttrsStr: string
  ) {
    if (!entityId || !entityName || !resourceAttrsStr)
      throw new Error('addResourceAttr problem: null argument');
    const resourceAttrs = JSON.parse(resourceAttrsStr);
    const attributes = await ngacRepo(context).upsertResourceAttr(
      createResource({ context, entityId, entityName, resourceAttrs })
    );
    return attributes
      ? Buffer.from(JSON.stringify(attributes))
      : getErrorMessage('upsertResourceAttr');
  }

  @Transaction(false)
  async getMSPAttrByMSPID(context: MyContext, mspid: string) {
    if (!mspid) throw new Error('getMSPAttrByMSPID problem: null argument');
    const attributes = await ngacRepo(context).getMSPAttrByMSPID(mspid);
    return attributes
      ? Buffer.from(JSON.stringify(attributes))
      : getErrorMessage('getMSPAttrByMSPID');
  }

  @Transaction(false)
  async getPolicyById(context: MyContext, x509id: string) {
    if (!x509id) throw new Error('getPolicyById problem: null argument');
    const policies = await ngacRepo(context).getPolicyById(x509id);
    return policies
      ? Buffer.from(JSON.stringify(policies))
      : getErrorMessage('getPolicyById');
  }

  @Transaction(false)
  async getPolicyByIdSid(context: MyContext, x509id: string, sid: string) {
    if (!x509id || !sid)
      throw new Error('getPolicyByIdSid problem: null argument');
    const policies = await ngacRepo(context).getPolicyByIdSid(x509id, sid);
    return policies
      ? Buffer.from(JSON.stringify(policies))
      : getErrorMessage('getPolicyByIdSid');
  }

  @Transaction(false)
  async getResourceAttrByURI(context: MyContext, uri: string) {
    if (!uri) throw new Error('getResourceAttrByURI problem: null argument');
    const attributes = await ngacRepo(context).getResourceAttrByURI(uri);
    return attributes
      ? Buffer.from(JSON.stringify(attributes))
      : getErrorMessage('getResourceAttrByURI');
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
