// prettier-ignore
export const CREATE_COMMIT = `
  mutation CreateCommit (
    $entityName: String!
    $id: String!
    $type: String!
    $payloadString: String!
  ) {
    createCommit(
      entityName: $entityName
      id: $id
      type: $type
      payloadString: $payloadString
    ) {
      id
      entityName
      version
      commitId
      entityId
      eventsString
    }
  }
`;
