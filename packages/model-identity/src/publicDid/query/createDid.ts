export const CREATE_DIDDOCUMENT = `
  mutation CreateDidDocument(
    $did: String!
    $signedRequest: String!
  ) {
    createDidDocument(
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
