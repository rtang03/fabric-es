import { gql } from '@apollo/client/core';
import { makeExecutableSchema } from 'graphql-tools';

export const resolvers = {
  Query: {
    me: () => 'Hello',
  },
  Mutation: {
    register: (
      _: any,
      { username, password, email }: { username: string; password: string; email: string }
    ) => {
      console.log(username, password, email);
      return true;
    },
  },
};

export const typeDefs = gql`
  type Query {
    me: String
  }

  type Mutation {
    register(email: String!, password: String!, username: String!): Boolean
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
