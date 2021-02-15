// prettier-ignore
export const PAGINATED_COMMIT = `
  query PaginatedCommit (
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
    paginatedCommit (
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
      total
      hasMore
      cursor
      items {
        id
        entityName
        version
        commitId
        entityId
        eventsString
      }
    }
  }
`;
