import { Request, Response } from 'express';

export const loginGetHandler = (req: Request, res: Response) => {
  res.render('login', {
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    state: req.query.state,
    response_type: req.query.response_type,
    grant_type: req.query.grant_type
  });
};
