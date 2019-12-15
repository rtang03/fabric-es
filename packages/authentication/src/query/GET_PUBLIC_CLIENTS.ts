// prettier-ignore
export const GET_PUBLIC_CLIENTS = `
  query GetPublicClients {
    getPublicClients {
      id
      applicationName
      user_id
      redirect_uris
      grants
    }
  }
`;
