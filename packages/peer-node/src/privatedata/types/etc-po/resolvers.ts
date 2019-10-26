import { Commit } from '@espresso/fabric-cqrs';
import { GraphQLResolveInfo } from 'graphql';
import { EtcPo } from '..';
import { DataSources } from '../../../types';

export type TArgEtcPo = {
  aboutEtcPo: null;
  createEtcPo: {
    userId: string;
    id: string;
    body: string;
  };
  getEtcPoById: {
    id: string;
  };
};

export type Resolvers<TArg = any> = {
  Query: {
    [P in keyof Partial<TArg>]: (
      parent: null | undefined,
      args: TArg[P],
      ctx: {
        dataSources: DataSources;
      },
      info?: GraphQLResolveInfo
    ) =>
      | string
      | Promise<Commit>
      | Promise<Commit[] | { error: any }>
      | Promise<EtcPo | { error: any }>;
  };
  Document: {
    etcPo: (
      { documentId: string },
      _args: any,
      ctx: {
        dataSources: DataSources;
      }
    ) => Promise<EtcPo>;
  };
};
