import { createStructuredSelector, Selector } from 'reselect';
import type { DidDocument } from '../../types';
import type { DidDocumentInRedis } from '../types';

export const didDocumentPostSelector: Selector<
  DidDocumentInRedis,
  DidDocument
> = createStructuredSelector({
  context: (item) => {
    try {
      return item?.context ? JSON.parse(item?.context)?.value : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  verificationMethod: (item) => {
    try {
      return item?.verification ? JSON.parse(item?.verification) : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  controller: (item) => item?.controller,
  created: (item) => {
    try {
      return item?.created ? new Date(parseInt(item?.created, 10)).toISOString() : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  id: (item) => item?.id,
  keyAgreement: (item) => {
    try {
      return item?.keyagr ? JSON.parse(item?.keyagr) : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  proof: (item) => {
    try {
      return item?.proof ? JSON.parse(item?.proof) : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  service: (item) => {
    try {
      return item?.service ? JSON.parse(item?.service) : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  updated: (item) => {
    try {
      return item?.updated ? new Date(parseInt(item?.updated, 10)).toISOString() : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  _ts: (item) => item?.ts,
});
