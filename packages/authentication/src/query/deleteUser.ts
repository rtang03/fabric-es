// prettier-ignore
export const DELETE_USER = `
  mutation DeleteUser (
    user_id: String!
  ) {
    deleteUser (
      user_id: $user_id
    )
  }
`;
