// prettier-ignore
export const CREATE_APPLICATION = `
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
