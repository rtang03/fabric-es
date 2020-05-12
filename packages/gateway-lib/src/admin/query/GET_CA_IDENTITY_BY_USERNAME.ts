/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const GET_CA_IDENTITY_BY_USERNAME = `query GetCaIdentityByUsername {
  getCaIdentityByUsername {
    id
    typ
    affiliation
    max_enrollments
    attrs {
      name
      value
    }
  }
}`;
