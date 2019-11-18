import { Request, Response } from 'express';
import { FileSystemWallet } from 'fabric-network';
import { verify } from 'jsonwebtoken';
import { MyContext } from '../types';

export const authenticatedContext: (option: {
  req: Request;
  res: Response;
  fabricConfig: {
    connectionProfile: string;
    wallet: FileSystemWallet;
  };
}) => MyContext = ({ req, res, fabricConfig }) => {
  const authorization = req.headers.authorization;
  let payload;

  if (authorization) {
    const token = authorization.split(' ')[1];
    try {
      payload = verify(token, process.env.ACCESS_TOKEN_SECRET!) || {};
    } catch (err) {
      const error = err.message || 'authentication error';
      // currently, payload.error is unused.
      payload = { error };
    }
  }

  return { req, res, fabricConfig, payload };
};
