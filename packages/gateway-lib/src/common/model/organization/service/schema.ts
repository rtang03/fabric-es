
export const orgTypeDefsQuery = `
  us: Organization
  getOrgById(mspId: String!): Organization
`;

export const orgTypeDefsType = `
type Organization @key(fields: "mspId") {
  mspId: String!
  name: String!
  url: String!
  status: Int!
  timestamp: String!
}
`;
