import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import type { VerificationMethod } from 'did-resolver';
import GraphQLJSON from 'graphql-type-json';
import { didDocumentCommandHandler } from './domain';
import type { DidDocument, DidDocumentContext } from './types';
import type { CreateDidOption } from './utils';

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
        const { data, status, error } = await repo.fullTextSearchEntity<DidDocument>({
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
  },
};
