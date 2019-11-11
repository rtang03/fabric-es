// import Express from 'express';
// import {
//   OAuth2Server,
//   Request,
//   Response,
//   Token
// } from 'oauth2-server-typescript';
// import { sendRefreshToken } from '../utils';
//
// export const refreshTokenHandler = (
//   oauth: OAuth2Server,
//   options = {
//     // 1 hr
//     accessTokenLifetime: 3600,
//     // 2 weeks
//     refreshTokenLifetime: 1209600,
//     // localhost:4000/oauth/token does not require client_secret, when using password grant type
//     requireClientAuthentication: { password: false }
//   }
// ) => async (req: Express.Request, res: Express.Response) => {
//   const request = new Request(req);
//   const response = new Response(res);
//   const accessToken: Token = await oauth.token(request, response, options);
//   if (accessToken) {
//     sendRefreshToken(res, accessToken.refreshToken);
//     return res.status(200).send({ ok: true, accessToken });
//   } else return res.status(200).send({ ok: false, accessToken: '' });
// };
