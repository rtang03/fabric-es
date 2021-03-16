import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { UserInputError } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import GraphQLJSON from 'graphql-type-json';
import { CreateDidOption } from '../types';
import { addressToDid, createKeyPair } from '../utils';
import { privateDidDocCommandHandler } from './domain';
import { PrivateDidDocument, PrivateDidDocumentContext } from './types';

type Args = {
  [K in 'id' | 'did' | 'controller' | 'publicKeyHex' | 'typ' | 'serviceEndpoint']: string;
};

const logger = getLogger('privateDid/resolvers.js');

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    isDidDoumentAlivePrivate: () => 'have a good day',
    resolveDidDocumentPrivate: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<PrivateDidDocument> => {
        if (!did) throw new UserInputError('missing did');

        return repo.getById({ enrollmentId, id: did }).then(({ currentState }) => currentState);
      },
      { fcnName: 'resolve-did', logger, useAdmin: false, useAuth: false }
    ),
  },
  Mutation: {
    createDidDocumentPrivate: catchResolverErrors(
      async (
        _,
        { did, publicKeyHex }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ) => {
        if (!did) throw new UserInputError('missing did');
        if (!publicKeyHex) throw new UserInputError('missing publicKeyHex');

        const payload: CreateDidOption = { id: did, controllerKey: publicKeyHex };

        return privateDidDocCommandHandler({ enrollmentId, repo }).Create({ did, payload });
      },
      { fcnName: 'createDidPrivate', logger, useAuth: false, useAdmin: false }
    ),
    createDidDocWithKeyGenPrivate: catchResolverErrors(
      async (
        _,
        __,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<{ did: string; publicKeyHex: string; privateKey: string; commit: Commit }> => {
        const { address, privateKey, publicKey } = createKeyPair();
        const did = addressToDid(address);
        const commit = await privateDidDocCommandHandler({ enrollmentId, repo }).Create({
          did,
          payload: { id: did, controllerKey: publicKey },
        });

        if (!commit?.commitId) throw new ApolloError('unknown error');

        return { did, publicKeyHex: publicKey, privateKey, commit };
      },
      { fcnName: 'createDidKGPrivate', logger, useAuth: false, useAdmin: false }
    ),
    addVerificationMethodPrivate: catchResolverErrors(
      async (
        _,
        { did, id, publicKeyHex, controller }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');
        if (!controller) throw new UserInputError('missing controller');
        if (!publicKeyHex) throw new UserInputError('missing publicKeyHex');

        return privateDidDocCommandHandler({ enrollmentId, repo }).AddVerificationMethod({
          did,
          payload: { id, publicKeyHex, controller },
        });
      },
      { fcnName: 'addVMPrivate', logger, useAuth: false, useAdmin: false }
    ),
    removeVerificationMethodPrivate: catchResolverErrors(
      async (
        _,
        { did, id }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');

        return privateDidDocCommandHandler({ enrollmentId, repo }).RemoveVerificationMethod({
          did,
          payload: { id },
        });
      },
      { fcnName: 'removeVMPrivate', logger, useAuth: false, useAdmin: false }
    ),
    addServiceEndpointPrivate: catchResolverErrors(
      async (
        _,
        { did, id, typ, serviceEndpoint }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');
        if (!typ) throw new UserInputError('missing typ');
        if (!serviceEndpoint) throw new UserInputError('missing serviceEndpoint');

        return privateDidDocCommandHandler({ enrollmentId, repo }).AddServiceEndpoint({
          did,
          payload: { id, type: typ, serviceEndpoint },
        });
      },
      { fcnName: 'addServicePrivate', logger, useAuth: false, useAdmin: false }
    ),
    removeServiceEndpointPrivate: catchResolverErrors(
      async (
        _,
        { did, id }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');
        if (!id) throw new UserInputError('missing id');

        return privateDidDocCommandHandler({ enrollmentId, repo }).RemoveServiceEndpoint({
          did,
          payload: { id },
        });
      },
      { fcnName: 'removeServicePrivate', logger, useAuth: false, useAdmin: false }
    ),
    deactivatePrivate: catchResolverErrors(
      async (
        _,
        { did }: Args,
        {
          dataSources: {
            privateDidDocument: { repo },
          },
          username: enrollmentId,
        }: PrivateDidDocumentContext
      ): Promise<Commit> => {
        if (!did) throw new UserInputError('missing did');

        return privateDidDocCommandHandler({ enrollmentId, repo }).Deactivate({
          did,
          payload: { id: did },
        });
      },
      { fcnName: 'deactivatePrivate', logger, useAuth: false, useAdmin: false }
    ),
  },
};
