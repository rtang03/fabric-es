export interface NetworkConfig {
  [org: string]: {
    mspid: string;
    url?: string;
    hostname?: string;
    tls_cacerts?: string;
    name?: string;
    ca?: {
      url: string;
      name: string;
    };
    peer1?: {
      requests: string;
      events: string;
      hostname: string;
      tls_cacerts: string;
    };
  };
}
