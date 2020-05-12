export const DECREMENT = `
  mutation Decrement ($counterId: String!) {
    decrement (
      counterId: $counterId
    ) {
      id
      entityName
      version
      commitId
      entityId
    }
  }
`;
