require('dotenv').config();

import { addToWallet } from '@espresso/fabric-cqrs';

addToWallet().catch(error => {
  console.error(error);
  process.exit();
});
