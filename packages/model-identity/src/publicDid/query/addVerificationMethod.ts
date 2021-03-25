export const ADD_VERIFICATION_METHOD = `
  mutation AddVerificationMethod(
    $did: String!
    $id: String!
    $controller: String!
    $publicKeyHex: String!
  ) {
    addVerificationMethod(
      did: $did
      id: $id
      controller: $controller
      publicKeyHex: $publicKeyHex
    ) {
      id
      entityName
      version
      commitId
      entityId
    }
  }
`;
