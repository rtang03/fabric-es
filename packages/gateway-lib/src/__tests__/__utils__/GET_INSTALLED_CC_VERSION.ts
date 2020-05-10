/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const GET_INSTALLED_CC_VERSION = `query GetInstalledCCVersion (
   $chaincode_id: String!
 ) {
  getInstalledCCVersion (
    chaincode_id: $chaincode_id
  )
}`;
