import type { Commit } from '@fabric-es/fabric-cqrs';
import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { UserInputError } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import DidJWT, { Signer } from 'did-jwt';
import GraphQLJSON from 'graphql-type-json';
import type { DidDocument } from '../types';
import { addressToDid, createDidDocument, createKeyPair } from '../utils';
import { didDocumentCommandHandler as handler } from './domain';
import type { DidDocumentContext as Context } from './types';

type Args = { [K in 'did' | 'signedRequest']: string };

const logger = getLogger('didDocument/resolvers.js');
const ENTITYNAME = 'didDocument';

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
        }: Context
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
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).Create({ did, signedRequest });
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
          username: enrollmentId,
        }: Context
      ): Promise<{ did: string; publicKeyHex: string; privateKey: string; commit: Commit }> => {
        const { address, privateKey, publicKey } = createKeyPair();
        const did = addressToDid(address);
        const payload = createDidDocument({ id: address, controllerKey: publicKey });
        const signer: Signer = DidJWT.ES256KSigner(privateKey);
        const signedRequest = await DidJWT.createJWT(
          {
            aud: did,
            entityName: ENTITYNAME,
            entityId: address,
            version: 0,
            events: [
              {
                type: 'DidDocumentCreated',
                lifeCycle: Lifecycle.BEGIN,
                payload,
              },
            ],
          },
          { issuer: did, signer },
          { alg: 'ES256K' }
        );

        const commit = await handler({ enrollmentId, repo }).Create({ did, signedRequest });

        if (!commit?.commitId) throw new ApolloError('unknown error');

        return { did, publicKeyHex: publicKey, privateKey, commit };
      },
      { fcnName: 'create-did-keygen', logger, useAdmin: false, useAuth: true }
    ),
    addVerificationMethod: catchResolverErrors(
      async (
        _,
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).AddVerificationMethod({ did, signedRequest });
      },
      { fcnName: 'add-vm', logger, useAdmin: false, useAuth: true }
    ),
    removeVerificationMethod: catchResolverErrors(
      async (
        _,
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).RemoveVerificationMethod({ did, signedRequest });
      },
      { fcnName: 'remove-vm', logger, useAdmin: false, useAuth: false }
    ),
    addServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).AddServiceEndpoint({ did, signedRequest });
      },
      { fcnName: 'add-service', logger, useAdmin: false, useAuth: true }
    ),
    removeServiceEndpoint: catchResolverErrors(
      async (
        _,
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).RemoveServiceEndpoint({ did, signedRequest });
      },
      { fcnName: 'remove-service', logger, useAdmin: false, useAuth: true }
    ),
    deactivate: catchResolverErrors(
      async (
        _,
        { did, signedRequest }: Args,
        {
          dataSources: {
            didDocument: { repo },
          },
          username: enrollmentId,
        }: Context
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!signedRequest) throw new UserInputError('missing signedRequest');

        return handler({ enrollmentId, repo }).Deactivate({ did, signedRequest });
      },
      { fcnName: 'revoke', logger, useAdmin: false, useAuth: true }
    ),
  },
};
