// prettier-ignore
export const META_GET_COMMIT_BY_ENTNAME_ID = `
  query MetaGetCommitByEntNameEntId (
    $creator: String
    $cursor: Int
    $pagesize: Int
    $entityName: String!
    $id: String
    $sortByField: String
    $sort: String
    $events: [String!]
    $startTime: Int
    $endTime: Int
  ) {
    metaGetCommitByEntNameEntId (
      creator: $creator
      cursor: $cursor
      pagesize: $pagesize
      entityName: $entityName
      id: $id
      sortByField: $sortByField
      sort: $sort
      events: $events
      startTime: $startTime
      endTime: $endTime
    ) {
      id
      entityName
      version
      commitId
      entityId
      eventsString
    }
  }
`;
