/* eslint-disable */
import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type Subscription = {
  pong?: Maybe<Scalars['String']>;
  entityAdded?: Maybe<EntityArrived>;
  systemEvent?: Maybe<Notification>;
};

export type SubscriptionEntityAddedArgs = {
  entityName?: Maybe<Scalars['String']>;
};

export type Notification = {
  event?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['Float']>;
};

export type EntityArrived = {
  events?: Maybe<Array<Maybe<Scalars['String']>>>;
  key?: Maybe<Scalars['String']>;
};

export type Query = {
  me?: Maybe<Scalars['String']>;
  fullTextSearchCommit?: Maybe<PaginatedCommit>;
  fullTextSearchEntity?: Maybe<PaginatedEntity>;
  paginatedEntity?: Maybe<PaginatedEntity>;
  paginatedCommit?: Maybe<PaginatedCommit>;
};

export type QueryFullTextSearchCommitArgs = {
  query?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type QueryFullTextSearchEntityArgs = {
  query?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type QueryPaginatedEntityArgs = {
  creator?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  entityName: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  scope?: Maybe<SearchScope>;
  startTime?: Maybe<Scalars['Int']>;
  endTime?: Maybe<Scalars['Int']>;
  sortByField?: Maybe<Scalars['String']>;
  sort?: Maybe<Scalars['String']>;
};

export type QueryPaginatedCommitArgs = {
  creator?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  entityName: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  events?: Maybe<Array<Scalars['String']>>;
  startTime?: Maybe<Scalars['Int']>;
  endTime?: Maybe<Scalars['Int']>;
  sortByField?: Maybe<Scalars['String']>;
  sort?: Maybe<Scalars['String']>;
};

export enum SearchScope {
  Created = 'CREATED',
  LastModified = 'LAST_MODIFIED',
}

export type PaginatedEntity = {
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items: Array<Maybe<QueryHandlerEntity>>;
};

export type PaginatedCommit = {
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items?: Maybe<Array<Maybe<Commit>>>;
};

export type QueryHandlerEntity = {
  id: Scalars['String'];
  entityName: Scalars['String'];
  value: Scalars['String'];
  commits: Array<Scalars['String']>;
  events: Scalars['String'];
  desc?: Maybe<Scalars['String']>;
  tag?: Maybe<Scalars['String']>;
  created: Scalars['Float'];
  creator: Scalars['String'];
  lastModified: Scalars['Float'];
  timeline: Scalars['String'];
};

export type Mutation = {
  ping?: Maybe<Scalars['Boolean']>;
  reloadEntities?: Maybe<Scalars['Boolean']>;
  createCommit?: Maybe<Commit>;
};

export type MutationPingArgs = {
  message?: Maybe<Scalars['String']>;
};

export type MutationReloadEntitiesArgs = {
  entityNames?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type MutationCreateCommitArgs = {
  entityName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  payloadString?: Maybe<Scalars['String']>;
};

export type Commit = {
  id?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  eventsString?: Maybe<Scalars['String']>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type FullTextSearchCommitQueryVariables = {
  query: Scalars['String'];
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type FullTextSearchCommitQuery = {
  fullTextSearchCommit?: Maybe<
    Pick<PaginatedCommit, 'total' | 'hasMore' | 'cursor'> & {
      items?: Maybe<
        Array<
          Maybe<
            Pick<Commit, 'id' | 'entityName' | 'version' | 'commitId' | 'entityId' | 'eventsString'>
          >
        >
      >;
    }
  >;
};

export type FtsEntityQueryVariables = {
  query?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type FtsEntityQuery = {
  fullTextSearchEntity?: Maybe<
    Pick<PaginatedEntity, 'total' | 'hasMore' | 'cursor'> & {
      items: Array<
        Maybe<
          Pick<
            QueryHandlerEntity,
            | 'id'
            | 'entityName'
            | 'value'
            | 'commits'
            | 'events'
            | 'tag'
            | 'desc'
            | 'created'
            | 'creator'
            | 'lastModified'
            | 'timeline'
          >
        >
      >;
    }
  >;
};

export type MeQueryVariables = {};

export type MeQuery = Pick<Query, 'me'>;

export const FullTextSearchCommitDocument = gql`
  query FullTextSearchCommit($query: String!, $cursor: Int, $pagesize: Int) {
    fullTextSearchCommit(query: $query, cursor: $cursor, pagesize: $pagesize) {
      total
      hasMore
      cursor
      items {
        id
        entityName
        version
        commitId
        entityId
        eventsString
      }
    }
  }
`;

/**
 * __useFullTextSearchCommitQuery__
 *
 * To run a query within a React component, call `useFullTextSearchCommitQuery` and pass it any options that fit your needs.
 * When your component renders, `useFullTextSearchCommitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFullTextSearchCommitQuery({
 *   variables: {
 *      query: // value for 'query'
 *      cursor: // value for 'cursor'
 *      pagesize: // value for 'pagesize'
 *   },
 * });
 */
export function useFullTextSearchCommitQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    FullTextSearchCommitQuery,
    FullTextSearchCommitQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<FullTextSearchCommitQuery, FullTextSearchCommitQueryVariables>(
    FullTextSearchCommitDocument,
    baseOptions
  );
}
export function useFullTextSearchCommitLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    FullTextSearchCommitQuery,
    FullTextSearchCommitQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    FullTextSearchCommitQuery,
    FullTextSearchCommitQueryVariables
  >(FullTextSearchCommitDocument, baseOptions);
}
export type FullTextSearchCommitQueryHookResult = ReturnType<typeof useFullTextSearchCommitQuery>;
export type FullTextSearchCommitLazyQueryHookResult = ReturnType<
  typeof useFullTextSearchCommitLazyQuery
>;
export type FullTextSearchCommitQueryResult = ApolloReactCommon.QueryResult<
  FullTextSearchCommitQuery,
  FullTextSearchCommitQueryVariables
>;
export const FtsEntityDocument = gql`
  query FTSEntity($query: String, $cursor: Int, $pagesize: Int) {
    fullTextSearchEntity(query: $query, cursor: $cursor, pagesize: $pagesize) {
      total
      hasMore
      cursor
      items {
        id
        entityName
        value
        commits
        events
        tag
        desc
        created
        creator
        lastModified
        timeline
      }
    }
  }
`;

/**
 * __useFtsEntityQuery__
 *
 * To run a query within a React component, call `useFtsEntityQuery` and pass it any options that fit your needs.
 * When your component renders, `useFtsEntityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFtsEntityQuery({
 *   variables: {
 *      query: // value for 'query'
 *      cursor: // value for 'cursor'
 *      pagesize: // value for 'pagesize'
 *   },
 * });
 */
export function useFtsEntityQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<FtsEntityQuery, FtsEntityQueryVariables>
) {
  return ApolloReactHooks.useQuery<FtsEntityQuery, FtsEntityQueryVariables>(
    FtsEntityDocument,
    baseOptions
  );
}
export function useFtsEntityLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<FtsEntityQuery, FtsEntityQueryVariables>
) {
  return ApolloReactHooks.useLazyQuery<FtsEntityQuery, FtsEntityQueryVariables>(
    FtsEntityDocument,
    baseOptions
  );
}
export type FtsEntityQueryHookResult = ReturnType<typeof useFtsEntityQuery>;
export type FtsEntityLazyQueryHookResult = ReturnType<typeof useFtsEntityLazyQuery>;
export type FtsEntityQueryResult = ApolloReactCommon.QueryResult<
  FtsEntityQuery,
  FtsEntityQueryVariables
>;
export const MeDocument = gql`
  query ME {
    me
  }
`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MeQuery, MeQueryVariables>
) {
  return ApolloReactHooks.useQuery<MeQuery, MeQueryVariables>(MeDocument, baseOptions);
}
export function useMeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQuery, MeQueryVariables>
) {
  return ApolloReactHooks.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, baseOptions);
}
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeQueryResult = ApolloReactCommon.QueryResult<MeQuery, MeQueryVariables>;
