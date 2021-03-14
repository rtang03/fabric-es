export const ADD_SERVICE_ENDPOINT = `
  mutation AddServiceEndpoint(
    $did: String!
    $id: String!
    $typ: String!
    $serviceEndpoint: String!
  ) {
    addServiceEndpoint(
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
