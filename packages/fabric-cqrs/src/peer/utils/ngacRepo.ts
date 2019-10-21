import { Network } from 'fabric-network';
import { submitNgac } from '../../services';
import { NgacRepo } from '../../types';

export const ngacRepo: (network: Network) => NgacRepo = network => ({
  addPolicy: () => submitNgac('addPolicy', [], { network })
});
