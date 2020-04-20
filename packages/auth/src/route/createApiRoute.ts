import express from 'express';
import httpStatus from 'http-status';
import omit from 'lodash/omit';
import passport from 'passport';

export const createApiRoute: () => express.Router = () => {
  const router = express.Router();
  router.get('/userinfo', passport.authenticate('bearer', { session: false }), (req, res) =>
    res.status(httpStatus.OK).send(omit(req.user, 'password'))
  );

  // below route is not tested
  router.get('/clientinfo', passport.authenticate('bearer', { session: false }), (req, res) =>
    res.status(httpStatus.OK).send(omit(req.user, 'client_secret'))
  );

  return router;
};
