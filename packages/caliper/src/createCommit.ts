import { Blockchain, TxStatus } from './types';

let bc: Blockchain;
let contx;
let bytesize;
let clientIdx;
let txIndex = 0;
const entityIds = [];
const entityName = 'caliper_createcommit';

const callback = {
  info: 'CreateCommit',
  init: async (blockchain, context, args) => {
    bc = blockchain;
    contx = context;
    clientIdx = context.clientIdx;
    // todo: may vary the payload
    bytesize = args.bytesize;
    return Promise.resolve();
  },
  run: async () => {
    const entityId = 'cal_test_' + txIndex;
    entityIds.push(entityId);
    txIndex++;
    const events = JSON.stringify([
      { type: 'TestCreated', payload: { content: 'no content' } }
    ]);
    return bc.invokeSmartContract(contx, 'eventstore', undefined, {
      chaincodeFunction: 'createCommit',
      chaincodeArguments: [entityName, entityId, '0', events],
      invokerIdentity: 'admin'
    });
  },
  end: async () => {
    const tearDown = entityIds.map(id => bc.invokeSmartContract(contx, 'eventstore', undefined, {
      chaincodeFunction: 'deleteByEntityId',
      chaincodeArguments: [entityName, id],
      invokerIdentity: 'admin'
    }));
    const waiting = new Promise(resolve => setTimeout(() => resolve(true), 3000));
    await waiting;
    await Promise.all(tearDown);
    return Promise.resolve();
  }
};

export = callback;
