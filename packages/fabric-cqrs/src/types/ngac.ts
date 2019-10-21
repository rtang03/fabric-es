import { Attribute } from './attribute';
import { Policy } from './policy';

export interface NgacRepo {
  addPolicy: (option: {
    policyClass: string;
    sid: string;
    url: string;
    allowedEvents: string[];
  }) => Promise<Policy | { error?: any; status?: string; message?: string }>;
  addMSPAttr: (option: {
    mspId: string;
    attributes: Attribute[];
  }) => Promise<
    Attribute[] | { error?: any; status?: string; message?: string }
  >;
  addResourceAttr: (option: {
    entityName: string;
    entityId: string;
    attributes: Attribute[];
  }) => Promise<
    Attribute[] | { error?: any; status?: string; message?: string }
  >;
  deleteMSPAttrByMSPID: (option: {
    mspId: string;
  }) => Promise<string | { error?: any; status?: string; message?: string }>;
  deletePolicyById: (option: {
    x509Id: string;
  }) => Promise<string[] | { error?: any; status?: string; message?: string }>;
  deletePolicyByIdSid: (option: {
    x509Id: string;
    sid: string;
  }) => Promise<string | { error?: any; status?: string; message?: string }>;
  deleteReourceAttrByURI: (option: {
    uri: string;
  }) => Promise<string[] | { error?: any; status?: string; message?: string }>;
  getMSPAttrByMSPID: (option: {
    mspId: string;
  }) => Promise<
    Attribute[] | { error?: any; status?: string; message?: string }
  >;
  getPolicyById: (option: {
    x509Id: string;
  }) => Promise<Policy | { error?: any; status?: string; message?: string }>;
  getPolicyByIdSid: (option: {
    x509Id: string;
    sid: string;
  }) => Promise<Policy | { error?: any; status?: string; message?: string }>;
  getResourceAttrByURI: (option: {
    uri: string;
  }) => Promise<
    Attribute[] | { error?: any; status?: string; message?: string }
  >;
  upsertResourceAttr: (option: {
    entityName: string;
    entityId: string;
    attributes: Attribute[];
  }) => Promise<
    Attribute[] | { error?: any; status?: string; message?: string }
  >;
}
