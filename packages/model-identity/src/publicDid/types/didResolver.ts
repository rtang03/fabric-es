import type { DidDocument } from './didDocument';

export type Params = {
  [index: string]: string;
};

export type ParsedDID = {
  did: string;
  didUrl: string;
  method: string;
  id: string;
  path?: string;
  fragment?: string;
  query?: string;
  params?: Params;
};

type Resolver = {
  resolver: (didUrl: string) => Promise<DidDocument>;
};

export type DidResolver = (
  did: string,
  parsed: ParsedDID,
  resolver: Resolver
) => Promise<null | DidDocument>;

export type WrappedResolver = () => Promise<null | DidDocument>;

export type DIDCache = (parsed: ParsedDID, resolve: WrappedResolver) => Promise<null | DidDocument>;

export type ResolverRegistry = {
  [index: string]: DidResolver;
};
