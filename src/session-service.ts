import { randomUUID } from "crypto";
import validator from 'validator'

import database, { Session } from "./database";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "./api/api";

var sessions: {[key: string]: Session} = {};

export const SESSION_EXPIRE_TIME = 604800000; // 7 Days

declare global {
    namespace Express {
        interface Request {
            /** Session object exposed when using sessionService.middleware */
            session: Session
        }
    }
}

export default {
    createSession(userId: number): Session {
        var token = randomUUID();
        var session: Session = {
            token: token,
            owner: userId,
            created: Date.now(),
            lastRefresh: Date.now()
        }
        sessions[token] = session;
        database.sessions.addSession(session);
        return session;
    },

    getSession(token: string|undefined): Session | undefined {
        if (!token || !validator.isUUID(token)) return undefined;
        var session = sessions[token];
        if (!session) return undefined;
        return session;
    },

    refreshSession(token: string) {
        sessions[token].lastRefresh = Date.now();
        database.sessions.refreshSession(token);
    },

    middleware(req: Request, res: Response, next: NextFunction) {
        var token = req.cookies['session-token']
        var session: Session|undefined = undefined;
        if (token || validator.isUUID(token)) session = sessions[token]

        if (!session) throw new ApiError("Invalid Session Token", 401);
        req.session = session;
        next();
    }
}