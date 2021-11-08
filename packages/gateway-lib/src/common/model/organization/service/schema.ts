
export const orgTypeDefsQuery = `
  us: _Organization
  getOrgById(mspId: String!): _Organization
  pubkey: String
`;

export const orgTypeDefsType = `
type _Organization @key(fields: "mspId") {
  mspId: String!
  name: String!
  url: String!
  pubkey: String
  status: Int!
  timestamp: String!
}
`;
