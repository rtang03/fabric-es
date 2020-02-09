// import gql from 'graphql-tag';
// import { RemoteData } from './remoteData';

// export const remoteTypeDefs = gql`
// type Query {
//   getRemoteData(entityId: String!): RemoteData
// }

// type RemoteData @key(fields: "entityId") {
//   entityId: String
//   entityName: String
//   version: Int
//   commitId: String
//   committedAt: String
//   json: String
// }
// `;

// export const remoteResolvers = {
//   Query: {
//     getRemoteData: async (_, { entityId }, { remoteData }: RemoteData) => {
//       return remoteData({
//         uri: '',
//         query: REMOTE_QUERY_ID,
//         operationName: 'GetRemoteData',
//         variables: { entityId }
//       }).then(({ data }) => data?.getRemoteData);
//     }
//   }
// };

// export const REMOTE_QUERY_ID = gql`
// query GetRemoteData($entityId: String!) {
//   getRemoteData(entityId: $entityId) {
//     entityId: String
//     entityName: String
//     version: Int
//     commitId: String
//     committedAt: String
//     json: String
//   }
// }`;

// export const localTypeDefs = gql`
// type Query {
//   getLocalData(entityId: String!, entityName: String!): String
// }
// `;

// export const localResolvers = {
//   Query: {
//     getLocalData: async (_, { entityId, entityName }, { dataSources, enrollmentId }) =>
//       JSON.stringify(dataSources[entityName].repo
//         .getById({ id: entityId, enrollmentId })
//         .then(({ currentState }) => currentState)
//         .catch(({ error }) => error))
//   }
// };