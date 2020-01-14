import { config } from 'dotenv';
import { resolve } from 'path';

if (process.env.NODE_ENV !== 'production')
  config({ path: resolve(__dirname, '../.env.test') }); // TODO <== double check
