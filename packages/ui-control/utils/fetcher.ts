import { request } from 'graphql-request';

const api = 'http://control/api/graphql';
export const fetcher = (query: string) => request(api, query);
