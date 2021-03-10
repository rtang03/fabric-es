// import { ApolloServerBase } from 'apollo-server-core';
import util from 'util';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { Request, Response } from 'express';
import gql from 'graphql-tag';
import nodeFetch from 'node-fetch';
import { getLogger } from './getLogger';

const fetch = nodeFetch as any;

export const getCatalog = async (req: Request, res: Response) => {
  const logger = getLogger('[gw-lib] catalog.js');

  const addr = req.socket.address();
  let results = [];

  if (typeof addr === 'object') {
    console.log('HAHA', `http://localhost:${addr.port}/graphql`);
    results = await makePromise(
      execute(
        new HttpLink({
          uri: `http://localhost:${addr.port}/graphql`,
          fetch,
        }),
        {
          query: gql`{
            __schema {
              types {
                name
                kind
              }
            }
          }`
        }
      )
    ).then(types => {
      if (!types || !types.data || !types.data.__schema || !types.data.__schema.types) {
        return ['Error reading schema'];
      } else {
        return types.data.__schema.types.filter(t => t.kind !== 'SCALAR' && !t.name.startsWith('__'));
      }
    }).catch((error) => {
      const result = util.format('Getting catalogue: %j', error);
      logger.error(result);
      return [result];
    });
  } else {
    results = [addr];
  }

  res.setHeader('content-type', 'text/markdown; charset=UTF-8');
  res.send(results);
};