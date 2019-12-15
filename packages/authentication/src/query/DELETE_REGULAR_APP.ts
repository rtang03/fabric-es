// prettier-ignore
export const DELETE_REGULAR_APP = `
  mutation DeleteRegularApp (
    $client_id: String!
  ) {
    deleteRegularApp (
      client_id: $client_id
    )
  }
`;
