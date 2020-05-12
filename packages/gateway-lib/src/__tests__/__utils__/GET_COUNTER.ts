export const GET_COUNTER = `query GetCounter ($counterId: String!) {
  getCounter (
    counterId: $counterId
  ) {
    value
  }
}`;
