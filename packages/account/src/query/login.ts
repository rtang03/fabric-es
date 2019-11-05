// prettier-ignore
export const LOGIN = `
  mutation login(
    $email: String!
    $password: String!
  ) {
    login (
      email: $email
      password: $password
    ) {
      accessToken
    }
  }
`;
