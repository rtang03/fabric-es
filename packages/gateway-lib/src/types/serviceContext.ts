import EC from 'elliptic';

export type ServiceContext = {
  user_id: string;
  username: string;
  accessor: string;
  signature: string;
  hash: string;
  id: string;
  pubkey: string;
  aclPath: string;
  ec: EC.ec;
};