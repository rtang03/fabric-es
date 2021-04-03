import { createStructuredSelector, Selector } from 'reselect';
import type { OutputDidDocument } from '../../types';
import { addressToDid } from '../../utils';
import type { DidDocumentInRedis } from '../types';

export const didDocumentPostSelector: Selector<
  DidDocumentInRedis,
  OutputDidDocument
> = createStructuredSelector({
  context: (item) => {
    try {
      return item?.context ? JSON.parse(item?.context)?.value : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  publicKey: (item) => {
    try {
      return item?.publickey ? JSON.parse(item?.publickey) : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  controller: (item) => item?.controller,
  created: (item) => {
    try {
      return item?.created ? new Date(parseInt(`${item?.created}`, 10)).toISOString() : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
  // restore back to Did syntax
  id: (item) => addressToDid(item?.id),
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
      return item?.ts ? new Date(parseInt(`${item?.ts}`, 10)).toISOString() : undefined;
    } catch {
      console.warn('fail to parse data');
      return null;
    }
  },
});
