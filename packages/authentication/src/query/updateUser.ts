// prettier-ignore
export const UPDATE_USER = `
  mutation UpdateUser (
    $email: String!
    $username: String!
  ) {
    updateUser (
      email: $email
      username: $username
    )
  }
`;
