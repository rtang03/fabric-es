export const ADD_SERVICE_ENDPOINT = `
  mutation AddServiceEndpoint(
    $did: String!
    $signedRequest: String!
  ) {
    addServiceEndpoint(
      did: $did
      signedRequest: $signedRequest
    ) {
      id
      entityName
      version
      commitId
      entityId
    }
  }
`;
