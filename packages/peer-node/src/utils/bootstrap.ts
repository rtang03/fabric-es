import { getNetwork } from '@espresso/fabric-cqrs';

let networkConfig;

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping - Onchain  ♨️♨️');
  const enrollmentId = '';
  networkConfig = await getNetwork({ enrollmentId });
};
