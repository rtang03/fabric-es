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

export type Client = {
   __typename?: 'Client',
  id: Scalars['String'],
  applicationName: Scalars['String'],
  client_secret: Scalars['String'],
  redirect_uris: Array<Scalars['String']>,
  grants: Array<Scalars['String']>,
  user_id: Scalars['String'],
};

export type CreateAppResponse = {
   __typename?: 'CreateAppResponse',
  ok: Scalars['Boolean'],
  client_id: Scalars['String'],
  applicationName: Scalars['String'],
  client_secret: Scalars['String'],
  redirect_uri?: Maybe<Scalars['String']>,
};

export type LoginResponse = {
   __typename?: 'LoginResponse',
  ok: Scalars['Boolean'],
  accessToken: Scalars['String'],
  user: OUser,
};

export type Mutation = {
   __typename?: 'Mutation',
  createApplication: CreateAppResponse,
  createRootClient: Scalars['String'],
  login: LoginResponse,
  register: Scalars['Boolean'],
  logout: Scalars['Boolean'],
  updateUser: Scalars['Boolean'],
};


export type MutationCreateApplicationArgs = {
  redirect_uri?: Maybe<Scalars['String']>,
  grants: Array<Scalars['String']>,
  applicationName: Scalars['String']
};


export type MutationCreateRootClientArgs = {
  password: Scalars['String'],
  admin: Scalars['String']
};


export type MutationLoginArgs = {
  password: Scalars['String'],
  email: Scalars['String']
};


export type MutationRegisterArgs = {
  admin_password?: Maybe<Scalars['String']>,
  password: Scalars['String'],
  email: Scalars['String'],
  username: Scalars['String']
};


export type MutationUpdateUserArgs = {
  username: Scalars['String'],
  email: Scalars['String']
};

export type OUser = {
   __typename?: 'OUser',
  id: Scalars['String'],
  email: Scalars['String'],
  username: Scalars['String'],
};

export type Query = {
   __typename?: 'Query',
  helloClient: Scalars['String'],
  clients: Array<Client>,
  getRootClientId: Scalars['String'],
  hello: Scalars['String'],
  users: Array<OUser>,
  me?: Maybe<OUser>,
};

export type CreateRootClientMutationVariables = {
  admin: Scalars['String'],
  password: Scalars['String']
};


export type CreateRootClientMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'createRootClient'>
);

export type CreateAppForAuthCodeMutationVariables = {
  applicationName: Scalars['String'],
  redirect_uri: Scalars['String'],
  grants: Array<Scalars['String']>
};


export type CreateAppForAuthCodeMutation = (
  { __typename?: 'Mutation' }
  & { createApplication: (
    { __typename?: 'CreateAppResponse' }
    & Pick<CreateAppResponse, 'ok' | 'client_id' | 'client_secret' | 'redirect_uri'>
  ) }
);

export type CreateApplicationMutationVariables = {
  applicationName: Scalars['String'],
  grants: Array<Scalars['String']>
};


export type CreateApplicationMutation = (
  { __typename?: 'Mutation' }
  & { createApplication: (
    { __typename?: 'CreateAppResponse' }
    & Pick<CreateAppResponse, 'ok' | 'client_id' | 'client_secret' | 'redirect_uri'>
  ) }
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
    & Pick<LoginResponse, 'ok' | 'accessToken'>
    & { user: (
      { __typename?: 'OUser' }
      & Pick<OUser, 'id' | 'email' | 'username'>
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
    { __typename?: 'OUser' }
    & Pick<OUser, 'id' | 'email' | 'username'>
  )> }
);

export type RegisterAdminMutationVariables = {
  username: Scalars['String'],
  email: Scalars['String'],
  password: Scalars['String'],
  admin_password: Scalars['String']
};


export type RegisterAdminMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'register'>
);

export type RegisterUserMutationVariables = {
  username: Scalars['String'],
  email: Scalars['String'],
  password: Scalars['String']
};


export type RegisterUserMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'register'>
);

export type UpdateUserMutationVariables = {
  email: Scalars['String'],
  username: Scalars['String']
};


export type UpdateUserMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'updateUser'>
);

export type UsersQueryVariables = {};


export type UsersQuery = (
  { __typename?: 'Query' }
  & { users: Array<(
    { __typename?: 'OUser' }
    & Pick<OUser, 'id' | 'email' | 'username'>
  )> }
);


export const CreateRootClientDocument = gql`
    mutation CreateRootClient($admin: String!, $password: String!) {
  createRootClient(admin: $admin, password: $password)
}
    `;
export type CreateRootClientMutationFn = ApolloReactCommon.MutationFunction<CreateRootClientMutation, CreateRootClientMutationVariables>;

/**
 * __useCreateRootClientMutation__
 *
 * To run a mutation, you first call `useCreateRootClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateRootClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createRootClientMutation, { data, loading, error }] = useCreateRootClientMutation({
 *   variables: {
 *      admin: // value for 'admin'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useCreateRootClientMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateRootClientMutation, CreateRootClientMutationVariables>) {
        return ApolloReactHooks.useMutation<CreateRootClientMutation, CreateRootClientMutationVariables>(CreateRootClientDocument, baseOptions);
      }
export type CreateRootClientMutationHookResult = ReturnType<typeof useCreateRootClientMutation>;
export type CreateRootClientMutationResult = ApolloReactCommon.MutationResult<CreateRootClientMutation>;
export type CreateRootClientMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateRootClientMutation, CreateRootClientMutationVariables>;
export const CreateAppForAuthCodeDocument = gql`
    mutation CreateAppForAuthCode($applicationName: String!, $redirect_uri: String!, $grants: [String!]!) {
  createApplication(applicationName: $applicationName, grants: $grants, redirect_uri: $redirect_uri) {
    ok
    client_id
    client_secret
    redirect_uri
  }
}
    `;
export type CreateAppForAuthCodeMutationFn = ApolloReactCommon.MutationFunction<CreateAppForAuthCodeMutation, CreateAppForAuthCodeMutationVariables>;

/**
 * __useCreateAppForAuthCodeMutation__
 *
 * To run a mutation, you first call `useCreateAppForAuthCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAppForAuthCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAppForAuthCodeMutation, { data, loading, error }] = useCreateAppForAuthCodeMutation({
 *   variables: {
 *      applicationName: // value for 'applicationName'
 *      redirect_uri: // value for 'redirect_uri'
 *      grants: // value for 'grants'
 *   },
 * });
 */
export function useCreateAppForAuthCodeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateAppForAuthCodeMutation, CreateAppForAuthCodeMutationVariables>) {
        return ApolloReactHooks.useMutation<CreateAppForAuthCodeMutation, CreateAppForAuthCodeMutationVariables>(CreateAppForAuthCodeDocument, baseOptions);
      }
export type CreateAppForAuthCodeMutationHookResult = ReturnType<typeof useCreateAppForAuthCodeMutation>;
export type CreateAppForAuthCodeMutationResult = ApolloReactCommon.MutationResult<CreateAppForAuthCodeMutation>;
export type CreateAppForAuthCodeMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateAppForAuthCodeMutation, CreateAppForAuthCodeMutationVariables>;
export const CreateApplicationDocument = gql`
    mutation CreateApplication($applicationName: String!, $grants: [String!]!) {
  createApplication(applicationName: $applicationName, grants: $grants) {
    ok
    client_id
    client_secret
    redirect_uri
  }
}
    `;
export type CreateApplicationMutationFn = ApolloReactCommon.MutationFunction<CreateApplicationMutation, CreateApplicationMutationVariables>;

/**
 * __useCreateApplicationMutation__
 *
 * To run a mutation, you first call `useCreateApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createApplicationMutation, { data, loading, error }] = useCreateApplicationMutation({
 *   variables: {
 *      applicationName: // value for 'applicationName'
 *      grants: // value for 'grants'
 *   },
 * });
 */
export function useCreateApplicationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateApplicationMutation, CreateApplicationMutationVariables>) {
        return ApolloReactHooks.useMutation<CreateApplicationMutation, CreateApplicationMutationVariables>(CreateApplicationDocument, baseOptions);
      }
export type CreateApplicationMutationHookResult = ReturnType<typeof useCreateApplicationMutation>;
export type CreateApplicationMutationResult = ApolloReactCommon.MutationResult<CreateApplicationMutation>;
export type CreateApplicationMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateApplicationMutation, CreateApplicationMutationVariables>;
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
    ok
    accessToken
    user {
      id
      email
      username
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
    mutation Logout {
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
    query ME {
  me {
    id
    email
    username
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
export const RegisterAdminDocument = gql`
    mutation RegisterAdmin($username: String!, $email: String!, $password: String!, $admin_password: String!) {
  register(username: $username, email: $email, password: $password, admin_password: $admin_password)
}
    `;
export type RegisterAdminMutationFn = ApolloReactCommon.MutationFunction<RegisterAdminMutation, RegisterAdminMutationVariables>;

/**
 * __useRegisterAdminMutation__
 *
 * To run a mutation, you first call `useRegisterAdminMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterAdminMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerAdminMutation, { data, loading, error }] = useRegisterAdminMutation({
 *   variables: {
 *      username: // value for 'username'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      admin_password: // value for 'admin_password'
 *   },
 * });
 */
export function useRegisterAdminMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterAdminMutation, RegisterAdminMutationVariables>) {
        return ApolloReactHooks.useMutation<RegisterAdminMutation, RegisterAdminMutationVariables>(RegisterAdminDocument, baseOptions);
      }
export type RegisterAdminMutationHookResult = ReturnType<typeof useRegisterAdminMutation>;
export type RegisterAdminMutationResult = ApolloReactCommon.MutationResult<RegisterAdminMutation>;
export type RegisterAdminMutationOptions = ApolloReactCommon.BaseMutationOptions<RegisterAdminMutation, RegisterAdminMutationVariables>;
export const RegisterUserDocument = gql`
    mutation RegisterUser($username: String!, $email: String!, $password: String!) {
  register(username: $username, email: $email, password: $password)
}
    `;
export type RegisterUserMutationFn = ApolloReactCommon.MutationFunction<RegisterUserMutation, RegisterUserMutationVariables>;

/**
 * __useRegisterUserMutation__
 *
 * To run a mutation, you first call `useRegisterUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerUserMutation, { data, loading, error }] = useRegisterUserMutation({
 *   variables: {
 *      username: // value for 'username'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useRegisterUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterUserMutation, RegisterUserMutationVariables>) {
        return ApolloReactHooks.useMutation<RegisterUserMutation, RegisterUserMutationVariables>(RegisterUserDocument, baseOptions);
      }
export type RegisterUserMutationHookResult = ReturnType<typeof useRegisterUserMutation>;
export type RegisterUserMutationResult = ApolloReactCommon.MutationResult<RegisterUserMutation>;
export type RegisterUserMutationOptions = ApolloReactCommon.BaseMutationOptions<RegisterUserMutation, RegisterUserMutationVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($email: String!, $username: String!) {
  updateUser(email: $email, username: $username)
}
    `;
export type UpdateUserMutationFn = ApolloReactCommon.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *      username: // value for 'username'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        return ApolloReactHooks.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, baseOptions);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = ApolloReactCommon.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const UsersDocument = gql`
    query Users {
  users {
    id
    email
    username
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