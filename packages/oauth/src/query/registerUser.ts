// prettier-ignore
export const REGISTER_USER = `
  mutation Register (
    $username: String!
    $email: String!
    $password: String!
  ) {
    register (
      username: $username
      email: $email
      password: $password
    ) 
  }
`;
