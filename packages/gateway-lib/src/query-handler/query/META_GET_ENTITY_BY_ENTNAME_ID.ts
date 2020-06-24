// prettier-ignore
export const META_GET_ENTITY_BY_ENTNAME_ID = `
  query MetaGetEntityByEntNameEntId (
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
    metaGetEntityByEntNameEntId (
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
      reducer
    }
  }
`;
