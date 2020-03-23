/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const IS_WALLET_EXIST = `query IsWalletExist (
  $label: String!
) {
  isWalletExist (
    label: $label
  )
}`;
