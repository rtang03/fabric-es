import { ApolloError } from 'apollo-server';

export interface QueryResponse {
  body: {
    data: any;
    errors: ApolloError[];
  };
}
