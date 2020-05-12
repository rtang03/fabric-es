export const INCREMENT = `
  mutation Increment ($counterId: String!) {
    increment (
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
