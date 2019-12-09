// For use by authorization_code grant type, which requires redirect_uri

// prettier-ignore
export const CREATE_APP_FOR_AUTHCODE = `
  mutation CreateApplication (
    $applicationName: String!
    $redirect_uri: String!
    $grants: [String!]!
  ) {
    createApplication (
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
