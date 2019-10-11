import { Attribute } from './attribute';
import { Policy } from './policy';
import { Resource } from './resource';

export interface NgacRepo {
  getAttrByMSPID: (mspid: string) => Promise<Attribute[]>;
  getResourceAttrByURI: (uri: string) => Promise<Attribute[]>;
  getPolicyById: (id: string) => Promise<Policy[]>;
  addResourceAttr: (resource: Resource) => any;
}
