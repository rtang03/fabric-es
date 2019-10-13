import { Attribute } from './attribute';
import { Policy } from './policy';
import { Resource } from './resource';

export interface NgacRepo {
  getMSPAttrByMSPID: (mspid: string) => Promise<Attribute[]>;
  getResourceAttrByURI: (uri: string) => Promise<Attribute[]>;
  getPolicyById: (x509id: string) => Promise<Policy[]>;
  getPolicyByIdSid: (x509id: string, sid: string) => Promise<Policy>;
  addResourceAttr: (resource: Resource) => any;
  addPolicy: (policy: Policy) => any;
  addMSPAttr: (resource: Resource) => any;
}
