// prettier-ignore
export const GET_ENTITYINFO = `
  query GetEntityInfo {
    getEntityInfo {
      entityName
      events
      creators
      orgs
      total
      totalCommit
      tagged
    }
  }
`;
