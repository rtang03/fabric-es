import { Blockchain, TxStatus } from './types';

let bc: Blockchain;
let contx;

const callback = {
  info: 'Querying By EntityName',
  init: async (blockchain, context, args) => {
    bc = blockchain;
    contx = context;
    return true;
  },
  run: async () => {
    const results: TxStatus[] = await bc.querySmartContract(
      contx,
      'eventstore',
      undefined,
      {
        chaincodeFunction: 'queryByEntityName',
        chaincodeArguments: ['dev_entity'],
        invokerIdentity: 'admin'
      },
      60
    );
    for (const result of results) {
      const shortID = result.GetID().substring(8);
      const executionTime = result.GetTimeFinal() - result.GetTimeCreate();
      // console.log(`TX [${shortID}] took ${executionTime}ms to execute. Result: ${result.GetStatus()}`);
    }
    return results;
  },
  end: async () => true
};

export = callback;
