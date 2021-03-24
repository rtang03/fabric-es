export const ADD_VERIFICATION_METHOD = `
  mutation AddVerificationMethod(
    $did: String!
    $signedRequest: String!
  ) {
    addVerificationMethod(
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
