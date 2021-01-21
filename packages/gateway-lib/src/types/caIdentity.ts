/**
 * @about CA Identity is is identity object of Fabric CA Server
 * @see [Fabric.User](https://hyperledger.github.io/fabric-sdk-node/release-2.2/User.html)
 */
export type CaIdentity = {
  id: string;
  typ: string;
  affiliation: string;
  max_enrollments: number;
  attrs: any[];
};
