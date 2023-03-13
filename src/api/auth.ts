import { Router, Request, Response } from 'express'
import { body, validationResult } from "express-validator";
import crypto from 'crypto'

import database from '../database';
import sessionService, { SESSION_EXPIRE_TIME } from '../session-service';
import { ApiError } from './api';


var router = Router();


router.post("/auth/login", 
    body('username').exists().matches(/^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/), 
    body('password').exists().matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,32}$/),
(req: Request, res: Response)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

    var hash = crypto.createHash('sha256').update(req.body.password).digest('base64');
    database.accounts.getUserWithHash(req.body.username, hash, (user)=>{
        if (!user) throw new ApiError("Invalid Username or Password");

        var session = sessionService.createSession(user.id);
        res.cookie('session-token', session.token, { maxAge: SESSION_EXPIRE_TIME, secure: true }).json({ success: true});
    });
});

router.post("/auth/register", 
    body('email').exists().matches(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/),
    body('username').exists().matches(/^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/), 
    body('password').exists().matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,32}$/),
(req: Request, res: Response)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

    database.accounts.checkUsername(req.body.username, (exists: boolean)=>{
        if (exists) throw new ApiError("Username already exists");

        var id = crypto.randomInt(281474976710655);
        var hash = crypto.createHash('sha256').update(req.body.password).digest('base64');
        database.accounts.createUser(id, req.body.username, req.body.email, hash);

        var session = sessionService.createSession(id);
        res.cookie('session-token', session.token, { maxAge: SESSION_EXPIRE_TIME, secure: true }).json({ success: true});
    });
});

router.get("/auth/refresh", (req: Request, res: Response)=>{
    var session = sessionService.getSession(req.cookies['session-token']);
    if (!session) throw new ApiError("Invalid Session Token", 401);

    sessionService.refreshSession(session.token);

    res.cookie('session-token', session.token, { maxAge: SESSION_EXPIRE_TIME, secure: true }).json({ success: true});
});

export default router;