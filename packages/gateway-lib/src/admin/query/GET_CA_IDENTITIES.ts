/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const GET_CA_IDENTITIES = `query GetCaIdentities {
  getCaIdentities {
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
