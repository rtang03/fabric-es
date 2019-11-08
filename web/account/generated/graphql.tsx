import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
};

export type Attribute = {
   __typename?: 'Attribute',
  name: Scalars['String'],
  value: Scalars['String'],
};

export type Identity = {
   __typename?: 'Identity',
  id: Scalars['String'],
  type: Scalars['String'],
  affiliation: Scalars['String'],
  max_enrollments: Scalars['Int'],
  attrs: Array<Attribute>,
  caname: Scalars['String'],
};

export type LoginResponse = {
   __typename?: 'LoginResponse',
  accessToken: Scalars['String'],
  user: User,
  userProfile: UserProfile,
};

export type Mutation = {
   __typename?: 'Mutation',
  login: LoginResponse,
  register: Scalars['Boolean'],
  logout: Scalars['Boolean'],
  revokeRefreshTokensForUser: Scalars['Boolean'],
};


export type MutationLoginArgs = {
  password: Scalars['String'],
  email: Scalars['String']
};


export type MutationRegisterArgs = {
  password: Scalars['String'],
  email: Scalars['String']
};


export type MutationRevokeRefreshTokensForUserArgs = {
  userId: Scalars['Int']
};

export type Query = {
   __typename?: 'Query',
  getAllIdentity?: Maybe<Array<Identity>>,
  getIdentityByEnrollmentId?: Maybe<Identity>,
  hello: Scalars['String'],
  bye: Scalars['String'],
  users: Array<User>,
  me?: Maybe<UserProfile>,
};


export type QueryGetIdentityByEnrollmentIdArgs = {
  enrollmentId: Scalars['String']
};

export type User = {
   __typename?: 'User',
  id: Scalars['Int'],
  email: Scalars['String'],
};

export type UserProfile = {
   __typename?: 'UserProfile',
  email: Scalars['String'],
  id: Scalars['String'],
  type: Scalars['String'],
  affiliation: Scalars['String'],
  max_enrollments: Scalars['Int'],
  attrs: Array<Attribute>,
  caname: Scalars['String'],
};

export type ByeQueryVariables = {};


export type ByeQuery = (
  { __typename?: 'Query' }
  & Pick<Query, 'bye'>
);

export type GetAllIdentityQueryVariables = {};


export type GetAllIdentityQuery = (
  { __typename?: 'Query' }
  & { getAllIdentity: Maybe<Array<(
    { __typename?: 'Identity' }
    & Pick<Identity, 'id' | 'type' | 'affiliation' | 'max_enrollments'>
    & { attrs: Array<(
      { __typename?: 'Attribute' }
      & Pick<Attribute, 'name' | 'value'>
    )> }
  )>> }
);

export type GetIdentityByEnrollmentIdQueryVariables = {
  enrollmentId: Scalars['String']
};


export type GetIdentityByEnrollmentIdQuery = (
  { __typename?: 'Query' }
  & { getIdentityByEnrollmentId: Maybe<(
    { __typename?: 'Identity' }
    & Pick<Identity, 'id' | 'type' | 'affiliation' | 'max_enrollments' | 'caname'>
    & { attrs: Array<(
      { __typename?: 'Attribute' }
      & Pick<Attribute, 'name' | 'value'>
    )> }
  )> }
);

export type HelloQueryVariables = {};


export type HelloQuery = (
  { __typename?: 'Query' }
  & Pick<Query, 'hello'>
);

export type LoginMutationVariables = {
  email: Scalars['String'],
  password: Scalars['String']
};


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & { login: (
    { __typename?: 'LoginResponse' }
    & Pick<LoginResponse, 'accessToken'>
    & { user: (
      { __typename?: 'User' }
      & Pick<User, 'id' | 'email'>
    ), userProfile: (
      { __typename?: 'UserProfile' }
      & Pick<UserProfile, 'id' | 'email' | 'type' | 'affiliation' | 'max_enrollments' | 'caname'>
      & { attrs: Array<(
        { __typename?: 'Attribute' }
        & Pick<Attribute, 'name' | 'value'>
      )> }
    ) }
  ) }
);

export type LogoutMutationVariables = {};


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'logout'>
);

export type MeQueryVariables = {};


export type MeQuery = (
  { __typename?: 'Query' }
  & { me: Maybe<(
    { __typename?: 'UserProfile' }
    & Pick<UserProfile, 'id' | 'email' | 'type' | 'affiliation' | 'max_enrollments' | 'caname'>
    & { attrs: Array<(
      { __typename?: 'Attribute' }
      & Pick<Attribute, 'name' | 'value'>
    )> }
  )> }
);

export type RegisterMutationVariables = {
  email: Scalars['String'],
  password: Scalars['String']
};


export type RegisterMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'register'>
);

export type UsersQueryVariables = {};


export type UsersQuery = (
  { __typename?: 'Query' }
  & { users: Array<(
    { __typename?: 'User' }
    & Pick<User, 'id' | 'email'>
  )> }
);


export const ByeDocument = gql`
    query bye {
  bye
}
    `;

/**
 * __useByeQuery__
 *
 * To run a query within a React component, call `useByeQuery` and pass it any options that fit your needs.
 * When your component renders, `useByeQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useByeQuery({
 *   variables: {
 *   },
 * });
 */
export function useByeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ByeQuery, ByeQueryVariables>) {
        return ApolloReactHooks.useQuery<ByeQuery, ByeQueryVariables>(ByeDocument, baseOptions);
      }
export function useByeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ByeQuery, ByeQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<ByeQuery, ByeQueryVariables>(ByeDocument, baseOptions);
        }
export type ByeQueryHookResult = ReturnType<typeof useByeQuery>;
export type ByeLazyQueryHookResult = ReturnType<typeof useByeLazyQuery>;
export type ByeQueryResult = ApolloReactCommon.QueryResult<ByeQuery, ByeQueryVariables>;
export const GetAllIdentityDocument = gql`
    query getAllIdentity {
  getAllIdentity {
    id
    type
    affiliation
    max_enrollments
    attrs {
      name
      value
    }
  }
}
    `;

/**
 * __useGetAllIdentityQuery__
 *
 * To run a query within a React component, call `useGetAllIdentityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllIdentityQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllIdentityQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAllIdentityQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAllIdentityQuery, GetAllIdentityQueryVariables>) {
        return ApolloReactHooks.useQuery<GetAllIdentityQuery, GetAllIdentityQueryVariables>(GetAllIdentityDocument, baseOptions);
      }
export function useGetAllIdentityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAllIdentityQuery, GetAllIdentityQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<GetAllIdentityQuery, GetAllIdentityQueryVariables>(GetAllIdentityDocument, baseOptions);
        }
export type GetAllIdentityQueryHookResult = ReturnType<typeof useGetAllIdentityQuery>;
export type GetAllIdentityLazyQueryHookResult = ReturnType<typeof useGetAllIdentityLazyQuery>;
export type GetAllIdentityQueryResult = ApolloReactCommon.QueryResult<GetAllIdentityQuery, GetAllIdentityQueryVariables>;
export const GetIdentityByEnrollmentIdDocument = gql`
    query getIdentityByEnrollmentId($enrollmentId: String!) {
  getIdentityByEnrollmentId(enrollmentId: $enrollmentId) {
    id
    type
    affiliation
    max_enrollments
    attrs {
      name
      value
    }
    caname
  }
}
    `;

/**
 * __useGetIdentityByEnrollmentIdQuery__
 *
 * To run a query within a React component, call `useGetIdentityByEnrollmentIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIdentityByEnrollmentIdQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIdentityByEnrollmentIdQuery({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *   },
 * });
 */
export function useGetIdentityByEnrollmentIdQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetIdentityByEnrollmentIdQuery, GetIdentityByEnrollmentIdQueryVariables>) {
        return ApolloReactHooks.useQuery<GetIdentityByEnrollmentIdQuery, GetIdentityByEnrollmentIdQueryVariables>(GetIdentityByEnrollmentIdDocument, baseOptions);
      }
export function useGetIdentityByEnrollmentIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetIdentityByEnrollmentIdQuery, GetIdentityByEnrollmentIdQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<GetIdentityByEnrollmentIdQuery, GetIdentityByEnrollmentIdQueryVariables>(GetIdentityByEnrollmentIdDocument, baseOptions);
        }
export type GetIdentityByEnrollmentIdQueryHookResult = ReturnType<typeof useGetIdentityByEnrollmentIdQuery>;
export type GetIdentityByEnrollmentIdLazyQueryHookResult = ReturnType<typeof useGetIdentityByEnrollmentIdLazyQuery>;
export type GetIdentityByEnrollmentIdQueryResult = ApolloReactCommon.QueryResult<GetIdentityByEnrollmentIdQuery, GetIdentityByEnrollmentIdQueryVariables>;
export const HelloDocument = gql`
    query Hello {
  hello
}
    `;

/**
 * __useHelloQuery__
 *
 * To run a query within a React component, call `useHelloQuery` and pass it any options that fit your needs.
 * When your component renders, `useHelloQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHelloQuery({
 *   variables: {
 *   },
 * });
 */
export function useHelloQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<HelloQuery, HelloQueryVariables>) {
        return ApolloReactHooks.useQuery<HelloQuery, HelloQueryVariables>(HelloDocument, baseOptions);
      }
export function useHelloLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<HelloQuery, HelloQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<HelloQuery, HelloQueryVariables>(HelloDocument, baseOptions);
        }
export type HelloQueryHookResult = ReturnType<typeof useHelloQuery>;
export type HelloLazyQueryHookResult = ReturnType<typeof useHelloLazyQuery>;
export type HelloQueryResult = ApolloReactCommon.QueryResult<HelloQuery, HelloQueryVariables>;
export const LoginDocument = gql`
    mutation login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user {
      id
      email
    }
    userProfile {
      id
      email
      type
      affiliation
      max_enrollments
      caname
      attrs {
        name
        value
      }
    }
  }
}
    `;
export type LoginMutationFn = ApolloReactCommon.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, baseOptions);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = ApolloReactCommon.MutationResult<LoginMutation>;
export type LoginMutationOptions = ApolloReactCommon.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation logout {
  logout
}
    `;
export type LogoutMutationFn = ApolloReactCommon.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        return ApolloReactHooks.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, baseOptions);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = ApolloReactCommon.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = ApolloReactCommon.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const MeDocument = gql`
    query me {
  me {
    id
    email
    type
    affiliation
    max_enrollments
    caname
    attrs {
      name
      value
    }
  }
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
export function useMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<MeQuery, MeQueryVariables>) {
        return ApolloReactHooks.useQuery<MeQuery, MeQueryVariables>(MeDocument, baseOptions);
      }
export function useMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, baseOptions);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeQueryResult = ApolloReactCommon.QueryResult<MeQuery, MeQueryVariables>;
export const RegisterDocument = gql`
    mutation register($email: String!, $password: String!) {
  register(email: $email, password: $password)
}
    `;
export type RegisterMutationFn = ApolloReactCommon.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, baseOptions);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = ApolloReactCommon.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = ApolloReactCommon.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const UsersDocument = gql`
    query users {
  users {
    id
    email
  }
}
    `;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<UsersQuery, UsersQueryVariables>) {
        return ApolloReactHooks.useQuery<UsersQuery, UsersQueryVariables>(UsersDocument, baseOptions);
      }
export function useUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UsersQuery, UsersQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<UsersQuery, UsersQueryVariables>(UsersDocument, baseOptions);
        }
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersQueryResult = ApolloReactCommon.QueryResult<UsersQuery, UsersQueryVariables>;