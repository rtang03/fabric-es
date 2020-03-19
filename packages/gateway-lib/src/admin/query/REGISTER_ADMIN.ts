/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const REGISTER_ADMIN = `
  mutation Register (
    $username: String!
    $email: String!
    $password: String!
    $admin_password: String!
  ) {
    register (
      username: $username
      email: $email
      password: $password
      admin_password: $admin_password
    )
  }
`;
