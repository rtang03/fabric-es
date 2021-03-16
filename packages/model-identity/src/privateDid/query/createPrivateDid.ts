export const CREATE_PRIVATE_DIDDOCUMENT = `
  mutation CreateDidDocumentPrivate(
    $did: String!
    $publicKeyHex: String!
  ) {
    createDidDocumentPrivate(
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

