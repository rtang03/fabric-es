// prettier-ignore
export const GET_CLIENTS = `
  query GetClients {
    getClients {
      id
      client_secret
      applicationName
      user_id
      redirect_uris
      grants
    }
  }
`;
