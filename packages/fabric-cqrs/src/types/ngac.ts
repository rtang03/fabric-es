import { Attribute } from './attribute';
import { Policy } from './policy';

export interface NgacRepo {
  addPolicy?: () => Promise<Policy>;
  addMSPAttr?: () => Promise<Attribute[]>;
  addResourceAttr?: () => Promise<Attribute[]>;
  deleteMSPAttrByMSPID?: () => Promise<string>;
  deletePolicyById?: () => Promise<string[]>;
  deletePolicyByIdSid?: () => Promise<string>;
  deleteReourceAttrByURI?: () => Promise<string[]>;
  getMSPAttrByMSPID?: () => Promise<Attribute[]>;
  getPolicyById?: () => Promise<Policy>;
  getPolicyByIdSid?: () => Promise<Policy>;
  getResourceAttrByURI?: () => Promise<Attribute[]>;
  upsertResourceAttr?: () => Promise<Attribute[]>;
}
