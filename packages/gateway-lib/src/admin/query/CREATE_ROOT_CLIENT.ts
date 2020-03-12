// prettier-ignore
export const CREATE_ROOT_CLIENT = `
  mutation CreateRootClient (
    $admin: String!
    $password: String!
  ) {
    createRootClient (
      admin: $admin
      password: $password
    )
  }
`;
