// prettier-ignore
export const LOGIN = `
  mutation Login (
    $email: String!
    $password: String!
  ) {
    login (
      email: $email
      password: $password
    ) {
      ok
      accessToken
      user {
        id
        email
        username
      }
    }
  }
`;
