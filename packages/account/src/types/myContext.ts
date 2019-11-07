import { Request, Response } from 'express';
import { FileSystemWallet } from 'fabric-network';

export interface MyContext {
  req: Request;
  res: Response;
  payload?: { userId: string, error?: any};
  fabricConfig?: {
    connectionProfile: string;
    wallet: FileSystemWallet;
  };
}
