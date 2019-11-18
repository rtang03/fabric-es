import { sign } from 'jsonwebtoken';
import { OUser } from '../entity/OUser';

export const getAccessToken = (user: OUser) =>
  sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m'
  });

export const getRefreshToken = (user: OUser) =>
  sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '7d'
  });
