export const ADD_SERVICE_ENDPOINT = `
  mutation AddServiceEndpointPrivate(
    $did: String!
    $id: String!
    $typ: String!
    $serviceEndpoint: String!
  ) {
    addServiceEndpointPrivate(
      did: $did
      id: $id
      typ: $typ
      serviceEndpoint: $serviceEndpoint
    ) {
      id
      entityName
      version
      commitId
      entityId
    }
  }
`;
