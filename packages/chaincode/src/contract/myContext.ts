import { Context } from 'fabric-contract-api';
import { ChaincodeStub } from 'fabric-shim';
import { StateList } from '../ledger-api';

export class MyContext extends Context {
  stateList?: StateList;
  stub: ChaincodeStub;

  constructor() {
    super();
    this.stateList = new StateList(this, 'entities');
  }
}
