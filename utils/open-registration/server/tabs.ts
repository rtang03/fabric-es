const endpoint =
  require('../servers.json').peer_node_uri || 'http://localhost:4000/graphql';

export const tabs = [
  {
    name: 'PeerInfo',
    query: '{ getPeerInfo { peerName, mspid } }',
    endpoint,
    responses: ['// return peer name & MSP Id; allow guest access']
  },
  {
    name: 'Block',
    query: `{ getBlockByNumber ( blockNumber: 100 ) {
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
}`,
    endpoint,
    responses: ['// return block content; allow guest access']
  },
  {
    name: 'Wallet',
    query: `{ listWallet { label, mspId, identifier } }`,
    endpoint,
    responses: ['// return all wallet entries; requires admin right']
  },
  {
    name: 'MyEcert',
    query: `{ getCaIdentityByEnrollmentId (
    enrollmentId: "1b5e118f-4d74-4a5e-be5b-555bdde754e1"
      ) {
        id
        typ
        affiliation
        max_enrollments
        attrs {
          name
          value
        }
      } }`,
    endpoint,
    responses: ['// return all wallet entries; requires log in']
  }
];
