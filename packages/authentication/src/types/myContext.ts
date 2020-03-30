import { Request, Response } from 'express';
import { Wallet } from 'fabric-network';
import { OAuth2Server } from 'oauth2-server-typescript/dist';

export interface MyContext {
  req: Request;
  res: Response;
  payload?: { userId: string; error?: any };
  fabricConfig?: {
    connectionProfile: string;
    wallet: Wallet;
  };
  oauth2Server?: OAuth2Server;
  oauthOptions?: any;
  rootAdmin?: string;
  rootAdminPassword?: string;
}
