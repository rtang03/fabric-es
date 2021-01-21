import { IIdentityRequest } from 'fabric-ca-client';

export interface Commit {
  id?: string;
  entityName?: string;
  version?: number;
  commitId?: string;
  hash?: string;
  entityId?: string;
  events?: any[];
}

export type Queries = {
  getMspid: () => string;
  disconnect: () => void;
};

/**
 * @about network operator
 */
export type NetworkOperator = {
  /**
   * @about some queries
   * @param option
   */
  getQueries: (option?: { asLocalhost: boolean }) => Promise<Queries>;
  /**
   * @about identiy server of Fabric CA server
   * @param option
   */
  identityService: (option?: {
    asLocalhost: boolean;
  }) => Promise<{
    disconnect: () => void;
    create: (request: IIdentityRequest) => Promise<any>;
    getAll: () => Promise<any>;
    getByEnrollmentId: (enrollmentId: string) => Promise<any>;
    deleteOne: (enrollmentId: string) => Promise<any>;
  }>;
  /**
   * @about register and enroll user of Fabric CA server
   * @param option
   */
  registerAndEnroll: (option: {
    enrollmentId: string;
    enrollmentSecret: string;
    asLocalhost?: boolean;
    eventHandlerStrategies?: any;
    queryHandlerStrategies?: any;
  }) => Promise<{
    disconnect: () => void;
    registerAndEnroll: () => Promise<any>;
  }>;
  /**
   * @about submit or transaction transaction
   * @param option
   */
  submitOrEvaluateTx: (option: {
    identity: string;
    chaincodeId: string;
    fcn: string;
    args?: string[];
    eventHandlerStrategies?: any;
    queryHandlerStrategies?: any;
    asLocalhost: boolean;
  }) => Promise<{
    disconnect: () => void;
    evaluate: () => Promise<Record<string, Commit> | { error: any }>;
    submit: () => Promise<Record<string, Commit> | { error: any }>;
  }>;
};
