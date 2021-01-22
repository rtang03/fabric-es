import { ApolloError } from 'apollo-server';

export type QueryResponse = {
  body: {
    data: any;
    errors: ApolloError[];
  };
};
