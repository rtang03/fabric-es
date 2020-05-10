/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const CREATE_WALLET = `
  mutation CreateWallet (
    $enrollmentSecret: String!
  ) {
    createWallet (
      enrollmentSecret: $enrollmentSecret
    )
  }
`;
