export const GET_BLOCK_BY_NUMBER = `
query GetBlockByNumber (
  $blockNumber: Int!
) {
  getBlockByNumber (
    blockNumber: $blockNumber
  ) {
    block_number
    previous_hash
    data_hash
    no_of_tx
    transaction {
      tx_id
      creator_mspid
      id_bytes
      input_args
      rwset
      response {
        status
        message
        payload
      }
      endorsements {
        endorser_mspid
        id_bytes
        signature
      }
    }
  }
}`;
