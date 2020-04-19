import express from 'express';
import passport from 'passport';
import { getLogger } from '../utils/getLogger';

const apiRoute = express.Router();

apiRoute.get('/userinfo', passport.authenticate('bearer', { session: false }), (req, res) => res.json(req.user));

apiRoute.get('/clientinfo', passport.authenticate('bearer', { session: false }), (req, res) => res.json(req.user));

export { apiRoute };
