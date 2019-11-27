// For use by client_credential grant type, which does not require redirect_uri

// prettier-ignore
export const CREATE_SYSTEM_APPLICATION = `
  mutation CreateApplication (
    $applicationName: String!
    $grants: [String!]!
  ) {
    createApplication (
      applicationName: $applicationName
      grants: $grants
    ) {
      ok
      client_id
      client_secret
      redirect_uri
    }
  }
`;
