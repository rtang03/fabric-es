// import express from 'express';
// import { OAuth2Server, Request, Response } from 'oauth2-server-typescript';
// import util from 'util';
// import {
//   authenticateHandler,
//   authorizeHandler,
//   tokenHandler
// } from '../middleware';
//
// export const oauthRouter = (oauthServer: OAuth2Server) => {
//   const router = express.Router();
//   router.post('/token', tokenHandler(oauthServer));
//   router.post('/refresh_token', tokenHandler(oauthServer));
//   router.post('/authenticate', authenticateHandler(oauthServer));
//   router.get('/authorize', (req, res) => {
//     if (!req.app.locals.user) {
//       res.locals.user = req.app.locals.user;
//       return res.redirect(
//         util.format(
//           '/login?redirect=%s&client_id=%s&redirect_uri=%s',
//           req.path,
//           req.query.client_id,
//           req.query.redirect_uri
//         )
//       );
//     }
//     res.render('authorize', {
//       redirect: req.path,
//       client_id: req.query.client_id,
//       redirect_uri: req.query.redirect_uri
//     });
//   });
//   router.post('/authorize', authorizeHandler(oauthServer));
//
//   return router;
// };
