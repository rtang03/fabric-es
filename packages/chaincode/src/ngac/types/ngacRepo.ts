import { Attribute } from './attribute';
import { Policy } from './policy';
import { Resource } from './resource';

export interface NgacRepo {
  addPolicy: (policy: Policy) => Promise<Policy>;
  addMSPAttr: (resource: Resource) => Promise<Attribute[]>;
  addResourceAttr: (resource: Resource) => Promise<Attribute[]>;
  deleteMSPAttrByMSPID: (mspid: string) => Promise<string>;
  deletePolicyById: (x509id: string) => Promise<string[]>;
  deletePolicyByIdSid: (x509id: string, sid: string) => Promise<string>;
  deleteReourceAttrByURI: (uri: string) => Promise<string[]>;
  getMSPAttrByMSPID: (mspid: string) => Promise<Attribute[]>;
  getPolicyById: (x509id: string) => Promise<Policy[]>;
  getPolicyByIdSid: (x509id: string, sid: string) => Promise<Policy>;
  getResourceAttrByURI: (uri: string) => Promise<Attribute[]>;
}
