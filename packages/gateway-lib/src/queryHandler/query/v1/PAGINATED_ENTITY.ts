// prettier-ignore
export const PAGINATED_ENTITY = `
  query PaginatedEntity (
    $creator: String
    $cursor: Int
    $pagesize: Int
    $entityName: String!
    $id: String
    $sortByField: String
    $sort: String
    $scope: SearchScope
    $startTime: Int
    $endTime: Int
  ) {
    paginatedEntity (
      creator: $creator
      cursor: $cursor
      pagesize: $pagesize
      entityName: $entityName
      id: $id
      sortByField: $sortByField
      sort: $sort
      scope: $scope
      startTime: $startTime
      endTime: $endTime
    ) {
      total
      hasMore
      cursor
      items {
        id
        entityName
        value
        commits
        events
        tag
        desc
        created
        creator
        lastModified
        timeline
      }
    }
  }
`;
