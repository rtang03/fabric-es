export const IS_WALLET_ENTRY_EXIST = `query IsWalletEntryExist (
  $label: String!
) {
  isWalletEntryExist (
    label: $label
  )
}`;
