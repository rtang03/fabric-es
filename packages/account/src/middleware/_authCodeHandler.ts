import { Request, Response } from 'express';
import util from 'util';

export const _authCodeHandler = (req: Request, res: Response) => {
  // if (!req.app.locals.user) {
  //   return res.redirect(
  //     util.format(
  //       '/login?redirect=%s&client_id=%s&redirect_uri=%s',
  //       req.path,
  //       req.query.client_id,
  //       req.query.redirect_uri
  //     )
  //   );
  // }
  // return res.send({
  //   authorize: {
  //     client_id: req.query.client_id,
  //     redirect_uri: req.query.redirect_uri
  //   }
  // });
};
