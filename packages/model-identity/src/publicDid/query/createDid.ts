export const CREATE_DIDDOCUMENT = `
  mutation CreateDidDocument(
    $did: String!
    $publicKeyHex: String!
  ) {
    createDidDocument(
      did: $did
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
