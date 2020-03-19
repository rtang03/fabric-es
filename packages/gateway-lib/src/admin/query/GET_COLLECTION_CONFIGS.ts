/**
 * @packageDocumentation
 * @hidden
 */

// prettier-ignore
export const GET_COLLECTION_CONFIGS = `query GetCollectionConfigs {
  getCollectionConfigs {
    name
    typ
    required_peer_count
    maximum_peer_count
    member_read_only
    block_to_live
    policy
  }
}`;
