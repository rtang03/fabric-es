export const ADD_VERIFICATION_METHOD = `
  mutation AddVerificationMethodPrivate(
    $did: String!
    $id: String!
    $controller: String!
    $publicKeyHex: String!
  ) {
    addVerificationMethodPrivate(
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
