// prettier-ignore
export const UPDATE_REGULAR_APP = `
  mutation UpdateRegularApp (
    $client_id: String!
    $applicationName: String
    $redirect_uri: String
  ) {
    updateRegularApp (
      client_id: $client_id
      applicationName: $applicationName
      redirect_uri: $redirect_uri
    )
  }
`;
