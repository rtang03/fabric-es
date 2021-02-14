// prettier-ignore
export const GET_NOTIFICATIONS = `
  query GetNotifications {
    getNotifications {
      id
      commitId
      entityName
      creator
      read
    }
  }
`;

export const GET_NOTIFICATION = `
  query GetNotification (
    $entityName: String!
    $id: String!
    $commitId: String!
  ) {
    getNotification (
      entityName: $entityName
      id: $id
      commitId: $commitId
    ) {
      id
      commitId
      entityName
      creator
      read
    }
  }
`;
