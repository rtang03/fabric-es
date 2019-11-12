import { sign } from 'jsonwebtoken';
import { OUser } from '../entity/OUser';
import { User } from '../entity/User';

export const createAccessToken = (user: User | OUser) => {
  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m'
  });
};

export const createRefreshToken = (user: User | OUser) =>
  sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: '7d'
    }
  );
