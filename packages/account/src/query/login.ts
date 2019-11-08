// prettier-ignore
export const LOGIN = `
  mutation login (
    $email: String!
    $password: String!
  ) {
    login (
      email: $email
      password: $password
    ) {
      accessToken
      user {
        id
        email
      }
      userProfile {
        id
        email
        type
        affiliation
        max_enrollments
        caname
        attrs {
          name
          value
        }
      }
    }
  }
`;
