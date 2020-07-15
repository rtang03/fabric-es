let bc;
let contx;
let bytesize;
let clientIdx;
let txIndex = 0;
const entityIds = [];
const entityName = 'caliper_createcommit';

const createCommitId = () => `${new Date(Date.now()).toISOString().replace(/[^0-9]/g, '')}`;

const callback = {
  info: 'CreateCommit',
  init: async (blockchain, context, args) => {
    bc = blockchain;
    contx = context;
    clientIdx = context.clientIdx;
    // todo: may vary the payload
    bytesize = args.bytesize;
    return true;
  },
  run: async () => {
    const entityId = 'cal_test_' + txIndex;
    entityIds.push(entityId);
    txIndex++;
    const events = JSON.stringify([{ type: 'TestCreated', payload: { content: 'no content' } }]);
    const status = await bc.invokeSmartContract(
      contx,
      'eventstore',
      '',
      {
        chaincodeFunction: 'eventstore:createCommit',
        chaincodeArguments: [entityName, entityId, '0', events, createCommitId()],
        // invokerIdentity: 'admin-org1.net',
      },
      10
    );
    console.log('Status', status)
    return status;
  },
  end: async () => {
    const tearDown = entityIds.map((id) =>
      bc.invokeSmartContract(contx, 'eventstore', undefined, {
        chaincodeFunction: 'eventstore:deleteByEntityId',
        chaincodeArguments: [entityName, id],
        invokerIdentity: 'admin-org1.net',
      })
    );
    const waiting = new Promise((resolve) => setTimeout(() => resolve(true), 3000));
    await waiting;
    await Promise.all(tearDown);
    return true;
  },
};

export = callback;
