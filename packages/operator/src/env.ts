import { resolve } from 'path';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') config({ path: './.env.dev' });
