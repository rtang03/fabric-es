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
};

export type Query = {
  me: User;
};

export type User = {
  id: Scalars['String'];
  username: Scalars['String'];
  is_deleted: Scalars['Boolean'];
  is_admin: Scalars['Boolean'];
  password: Scalars['String'];
};

export type Mutation = {
  register?: Maybe<RegisteredUser>;
  login?: Maybe<LoggedInUser>;
  logout?: Maybe<Scalars['Boolean']>;
  forget?: Maybe<Scalars['Boolean']>;
  reset?: Maybe<Scalars['Boolean']>;
};

export type MutationRegisterArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};

export type MutationLoginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};

export type MutationForgetArgs = {
  email: Scalars['String'];
};

export type MutationResetArgs = {
  password: Scalars['String'];
  password2: Scalars['String'];
};

export type RegisteredUser = {
  username: Scalars['String'];
  id: Scalars['String'];
};

export type LoggedInUser = {
  username: Scalars['String'];
  id: Scalars['String'];
  access_token: Scalars['String'];
  token_type: Scalars['String'];
};

export type ForgetMutationVariables = {
  email: Scalars['String'];
};

export type ForgetMutation = Pick<Mutation, 'forget'>;

export type LoginMutationVariables = {
  username: Scalars['String'];
  password: Scalars['String'];
};

export type LoginMutation = {
  login?: Maybe<Pick<LoggedInUser, 'id' | 'access_token' | 'username' | 'token_type'>>;
};

export type LogoutMutationVariables = {};

export type LogoutMutation = Pick<Mutation, 'logout'>;

export type MeQueryVariables = {};

export type MeQuery = { me: Pick<User, 'id' | 'username' | 'is_deleted' | 'is_admin'> };

export type RegisterMutationVariables = {
  username: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
};

export type RegisterMutation = { register?: Maybe<Pick<RegisteredUser, 'id' | 'username'>> };

export type ResetMutationVariables = {
  password: Scalars['String'];
  password2: Scalars['String'];
};

export type ResetMutation = Pick<Mutation, 'reset'>;

export const ForgetDocument = gql`
  mutation Forget($email: String!) {
    forget(email: $email)
  }
`;
export type ForgetMutationFn = ApolloReactCommon.MutationFunction<
  ForgetMutation,
  ForgetMutationVariables
>;

/**
 * __useForgetMutation__
 *
 * To run a mutation, you first call `useForgetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useForgetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [forgetMutation, { data, loading, error }] = useForgetMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useForgetMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<ForgetMutation, ForgetMutationVariables>
) {
  return ApolloReactHooks.useMutation<ForgetMutation, ForgetMutationVariables>(
    ForgetDocument,
    baseOptions
  );
}
export type ForgetMutationHookResult = ReturnType<typeof useForgetMutation>;
export type ForgetMutationResult = ApolloReactCommon.MutationResult<ForgetMutation>;
export type ForgetMutationOptions = ApolloReactCommon.BaseMutationOptions<
  ForgetMutation,
  ForgetMutationVariables
>;
export const LoginDocument = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      access_token
      username
      token_type
    }
  }
`;
export type LoginMutationFn = ApolloReactCommon.MutationFunction<
  LoginMutation,
  LoginMutationVariables
>;

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
 *      username: // value for 'username'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>
) {
  return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(
    LoginDocument,
    baseOptions
  );
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = ApolloReactCommon.MutationResult<LoginMutation>;
export type LoginMutationOptions = ApolloReactCommon.BaseMutationOptions<
  LoginMutation,
  LoginMutationVariables
>;
export const LogoutDocument = gql`
  mutation Logout {
    logout
  }
`;
export type LogoutMutationFn = ApolloReactCommon.MutationFunction<
  LogoutMutation,
  LogoutMutationVariables
>;

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
export function useLogoutMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutation, LogoutMutationVariables>
) {
  return ApolloReactHooks.useMutation<LogoutMutation, LogoutMutationVariables>(
    LogoutDocument,
    baseOptions
  );
}
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = ApolloReactCommon.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = ApolloReactCommon.BaseMutationOptions<
  LogoutMutation,
  LogoutMutationVariables
>;
export const MeDocument = gql`
  query ME {
    me {
      id
      username
      is_deleted
      is_admin
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
export const RegisterDocument = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      id
      username
    }
  }
`;
export type RegisterMutationFn = ApolloReactCommon.MutationFunction<
  RegisterMutation,
  RegisterMutationVariables
>;

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
 *      username: // value for 'username'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useRegisterMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>
) {
  return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument,
    baseOptions
  );
}
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = ApolloReactCommon.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RegisterMutation,
  RegisterMutationVariables
>;
export const ResetDocument = gql`
  mutation Reset($password: String!, $password2: String!) {
    reset(password: $password, password2: $password2)
  }
`;
export type ResetMutationFn = ApolloReactCommon.MutationFunction<
  ResetMutation,
  ResetMutationVariables
>;

/**
 * __useResetMutation__
 *
 * To run a mutation, you first call `useResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetMutation, { data, loading, error }] = useResetMutation({
 *   variables: {
 *      password: // value for 'password'
 *      password2: // value for 'password2'
 *   },
 * });
 */
export function useResetMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<ResetMutation, ResetMutationVariables>
) {
  return ApolloReactHooks.useMutation<ResetMutation, ResetMutationVariables>(
    ResetDocument,
    baseOptions
  );
}
export type ResetMutationHookResult = ReturnType<typeof useResetMutation>;
export type ResetMutationResult = ApolloReactCommon.MutationResult<ResetMutation>;
export type ResetMutationOptions = ApolloReactCommon.BaseMutationOptions<
  ResetMutation,
  ResetMutationVariables
>;
