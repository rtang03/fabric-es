// For use by application owner, which does not check for oauth root admin

// prettier-ignore
export const CREATE_REGULAR_APP = `
  mutation CreateRegularApp (
    $applicationName: String!
    $grants: [String!]!
    $redirect_uri: String!
  ) {
    createRegularApp (
      applicationName: $applicationName
      grants: $grants
      redirect_uri: $redirect_uri
    ) {
      ok
      client_id
      client_secret
      redirect_uri
    }
  }
`;
