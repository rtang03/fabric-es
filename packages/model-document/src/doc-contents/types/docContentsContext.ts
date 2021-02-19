import { DocContentsDataSource } from './index';

export type DocContentsContext = {
  dataSources: { docContents: DocContentsDataSource };
  username: string;
};
