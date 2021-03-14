import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { UserInputError } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import GraphQLJSON from 'graphql-type-json';
import type { DidDocument } from '../types';
import type { CreateDidOption } from '../utils';
import { addressToDid, createKeyPair } from '../utils';
import { didDocumentCommandHandler } from './domain';
import type { DidDocumentContext } from './types';

type Args = {
  [K in 'id' | 'did' | 'controller' | 'publicKeyHex' | 'typ' | 'serviceEndpoint']: string;
};

const logger = getLogger('didDocument/resolvers.js');

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    isDidDocumentAlive: () => 'have a nice day',
    resolveDidDocument: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
        }: DidDocumentContext
      ): Promise<DidDocument> => {
        if (!did) throw new UserInputError('missing did');

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
        { did, publicKeyHex }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!publicKeyHex) throw new UserInputError('missing publicKeyHex');

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
    addVerificationMethod: catchResolverErrors(
      async (
        _,
        { did, id, publicKeyHex, controller }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');
        if (!controller) throw new UserInputError('missing controller');
        if (!publicKeyHex) throw new UserInputError('missing publicKeyHex');

        return didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).AddVerificationMethod({ did, payload: { id, publicKeyHex, controller } });
      },
      { fcnName: 'add-vm', logger, useAdmin: false, useAuth: false }
    ),
    removeVerificationMethod: catchResolverErrors(
      async (
        _,
        { did, id }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');

        return didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).RemoveVerificationMethod({ did, payload: { id } });
      },
      { fcnName: 'remove-vm', logger, useAdmin: false, useAuth: false }
    ),
    addServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did, id, typ, serviceEndpoint }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');
        if (!typ) throw new UserInputError('missing typ');
        if (!serviceEndpoint) throw new UserInputError('missing serviceEndpoint');

        return didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).AddServiceEndpoint({
          did,
          payload: {
            id,
            type: typ,
            serviceEndpoint,
          },
        });
      },
      { fcnName: 'add-service', logger, useAdmin: false, useAuth: false }
    ),
    removeServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did, id }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');

        return didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).RemoveServiceEndpoint({ did, payload: { id } });
      },
      { fcnName: 'remove-service', logger, useAdmin: false, useAuth: false }
    ),
    deactivate: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username,
        }: DidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');

        return didDocumentCommandHandler({
          enrollmentId: username,
          didDocumentRepo: repo,
        }).Deactivate({ did, payload: null });
      },
      { fcnName: 'revoke', logger, useAdmin: false, useAuth: false }
    ),
  },
};
