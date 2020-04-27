import { sign } from 'jsonwebtoken';
import { Client } from '../entity/Client';

export const generateToken: (option: {
  client?: Client;
  secret: string;
  user_id?: string;
  is_admin?: boolean;
  expiryInSeconds: number;
}) => string = ({ client, user_id, is_admin, secret, expiryInSeconds }) =>
  sign(
    Object.assign(
      {},
      {
        expires: Date.now() + expiryInSeconds * 1000
      },
      { client_id: client?.id },
      { is_admin },
      { user_id }
    ),
    secret,
    { expiresIn: expiryInSeconds }
  );
