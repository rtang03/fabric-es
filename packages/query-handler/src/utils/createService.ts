import { getNetwork, Reducer } from '@fabric-es/fabric-cqrs';
import { Wallet } from 'fabric-network';
import { createQueryHandler } from './createQueryHandler';
import { getLogger } from './getLogger';

export const createService: (option: {
  enrollmentId: string;
  reducers: Record<string, Reducer>;
  isPrivate?: boolean;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
}) => any = async (option) => {
  const logger = getLogger({ name: '[query-handler] createService.js' });
  const { asLocalhost, connectionProfile, channelName, enrollmentId, reducers, wallet } = option;
  const networkConfig = await getNetwork({
    discovery: true,
    asLocalhost,
    channelName,
    connectionProfile,
    wallet,
    enrollmentId,
  });
  const qh = createQueryHandler({
    ...networkConfig,
    channelName,
    connectionProfile,
    queryDatabase: undefined,
    wallet,
  });

  return {
    ...qh,
    config: () => {},
  };
};
