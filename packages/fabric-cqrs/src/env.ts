import { resolve } from 'path';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== ' production') config({ path: resolve(__dirname, '../.env.dev') });
