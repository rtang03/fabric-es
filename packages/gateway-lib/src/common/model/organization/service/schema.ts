
export const orgTypeDefsQuery = `
  us: Organization
  getOrgById(mspId: String!): Organization
  pubkey: String
`;

export const orgTypeDefsType = `
type Organization @key(fields: "mspId") {
  mspId: String!
  name: String!
  url: String!
  pubkey: String
  status: Int!
  timestamp: String!
}
`;
