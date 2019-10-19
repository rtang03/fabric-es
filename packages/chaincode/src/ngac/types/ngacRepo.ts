import { Attribute } from './attribute';
import { Policy } from './policy';
import { Resource } from './resource';

export interface NgacRepo {
  // add one policy
  addPolicy: (policy: Policy) => Promise<Policy>;
  // add and replace one attribute group to a MSPID
  addMSPAttr: (resource: Resource) => Promise<Attribute[]>;
  // add and replace one attribute group to a reource URI
  addResourceAttr: (resource: Resource) => Promise<Attribute[]>;
  deleteMSPAttrByMSPID: (mspid: string) => Promise<string>;
  // delete all policies by id
  deletePolicyById: (x509id: string) => Promise<string[]>;
  // delete one policy by id
  deletePolicyByIdSid: (x509id: string, sid: string) => Promise<string>;
  // delete attribute group by URI
  deleteReourceAttrByURI: (uri: string) => Promise<string[]>;
  // delete attribute group by MSPID
  getMSPAttrByMSPID: (mspid: string) => Promise<Attribute[]>;
  // get policies by id
  getPolicyById: (x509id: string) => Promise<Policy[]>;
  // get one policy
  getPolicyByIdSid: (x509id: string, sid: string) => Promise<Policy>;
  // get array of attribute group by URI path segment
  // this API may be useless; no such use case. This is not exposed as chaincode interface
  getResourceAttrGroupByURI: (uri: string) => Promise<Attribute[][]>;
  // get attribte gropu by URI
  getResourceAttrByURI: (uri: string) => Promise<Attribute[]>;
  // update and insert the attribute group, by appending the existing one
  upsertResourceAttr: (resource: Resource) => Promise<Attribute[]>;
}
