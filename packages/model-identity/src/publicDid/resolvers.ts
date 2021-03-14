import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import GraphQLJSON from 'graphql-type-json';
import type { DidDocument } from '../types';
import type { CreateDidOption } from '../utils';
import { addressToDid, createKeyPair } from '../utils';
import { didDocumentCommandHandler } from './domain';
import type { DidDocumentContext } from './types';

const logger = getLogger('didDocument/resolvers.js');

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    isDidDocumentAlive: () => 'have a nice day',
    resolveDidDocument: catchResolverErrors(
      async (
        _,
        { did }: { did: string },
        {
          dataSources: {
            didDocument: { repo },
          },
        }: DidDocumentContext
      ): Promise<DidDocument> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
          entityName: 'didDocument',
          query: `@id:${did}`,
          pagesize: 1,
          cursor: 0,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items[0];
      },
      { fcnName: 'resolve-did', logger, useAdmin: false, useAuth: false }
    ),
  },
  Mutation: {
    createDidDocument: catchResolverErrors(
      async (
        _,
        { did, publicKeyHex }: { did: string; publicKeyHex: string },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        const payload: CreateDidOption = { id: did, controllerKey: publicKeyHex };

        return didDocumentCommandHandler({ enrollmentId: username, didDocumentRepo: repo }).Create({
          did,
          payload,
        });
      },
      { fcnName: 'create-did', logger, useAdmin: false, useAuth: true }
    ),
    createDidDocWithKeyGen: catchResolverErrors(
      async (
        _,
        __,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<{ did: string; publicKeyHex: string; privateKey: string; commit: Commit }> => {
        const { address, privateKey, publicKey } = createKeyPair();
        const did = addressToDid(address);
        const commit = await didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).Create({ did, payload: { id: did, controllerKey: publicKey } });

        if (!commit?.commitId) throw new ApolloError('unknown error');

        return { did, publicKeyHex: publicKey, privateKey, commit };
      },
      { fcnName: 'create-did-keygen', logger, useAdmin: false, useAuth: true }
    ),
    AddVerificationMethod: catchResolverErrors(
      async (
        _,
        { did },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> =>
        didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).AddVerificationMethod({ did, payload: null }),
      { fcnName: 'add-vm', logger, useAdmin: false, useAuth: false }
    ),
    RemoveVerificationMethod: catchResolverErrors(
      async (
        _,
        { did },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> =>
        didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).RemoveVerificationMethod({ did, payload: null }),
      { fcnName: 'remove-vm', logger, useAdmin: false, useAuth: false }
    ),
    addServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did, id, type, serviceEndpoint },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> =>
        didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).AddServiceEndpoint({
          did,
          payload: {
            id,
            type,
            serviceEndpoint,
          },
        }),
      { fcnName: 'add-service', logger, useAdmin: false, useAuth: false }
    ),
    removeServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> =>
        didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).RemoveServiceEndpoint({ did, payload: null }),
      { fcnName: 'remove-service', logger, useAdmin: false, useAuth: false }
    ),
    deactivate: catchResolverErrors(
      async (
        _,
        { did },
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> =>
        didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).Deactivate({ did, payload: null }),
      { fcnName: 'revoke', logger, useAdmin: false, useAuth: false }
    ),
  },
};
