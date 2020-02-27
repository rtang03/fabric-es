import { Commit } from '@espresso/fabric-cqrs';
import { documentResolvers } from '@espresso/model-loan';
import { AuthenticationError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { documentCommandHandler, DocumentDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    getDocumentById(documentId: String!): Document
  }

  type Mutation {
    createDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String!
      link: String!
    ): DocResponse
    deleteDocument(userId: String!, documentId: String!): DocResponse
    restrictAccess(userId: String!, documentId: String!): DocResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
      link: String
    ): [DocResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    link: String
    status: Int!
    timestamp: String!
    loan: Loan
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    documents: [Document]
  }

  union DocResponse = DocCommit | DocError

  type DocEvent {
    type: String
  }

  type DocCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [DocEvent!]
  }

  type DocError {
    message: String!
    stack: String
  }
`;

const NOT_AUTHENICATED = 'no enrollment id';

export const resolvers = {
  ...documentResolvers,
  Mutation: {
    createDocument: async (
      _,
      { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : documentCommandHandler({
            enrollmentId,
            documentRepo: document.repo
          })
            .CreateDocument({
              userId,
              payload: {
                documentId,
                loanId,
                title,
                reference,
                link,
                timestamp: Date.now()
              }
            })
            .catch(({ error }) => error),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      if (!enrollmentId) throw new AuthenticationError(NOT_AUTHENICATED);

      const result: Commit[] = [];
      if (loanId) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentLoanId({
            userId,
            payload: { documentId, loanId, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (title) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentTitle({
            userId,
            payload: { documentId, title, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (reference) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentReference({
            userId,
            payload: { documentId, reference, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (link) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentLink({
            userId,
            payload: { documentId, link, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  }
};
