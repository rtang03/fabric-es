// prettier-ignore
export const REGISTER = `
  mutation register (
    $email: String!
    $password: String!
  ) {
    register (
      email: $email
      password: $password
    ) 
  }
`;
