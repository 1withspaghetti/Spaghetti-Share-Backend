import { randomUUID } from "crypto";
import validator from 'validator'

import database, { Session } from "./database";
import { Request, Response, NextFunction } from "express";

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

// On startup, grab saved sessions
database.sessions.getSessions((rows)=>{
    for (let session of rows) {
        sessions[session.token] = session;
    }
    console.log("Loaded "+rows.length+" sessions from database");
})

// Delete stale sessions
setInterval(()=>{
    database.sessions.purgeSessions(SESSION_EXPIRE_TIME);
    for (let token of Object.keys(sessions)) {
        if (sessions[token].lastRefresh < Date.now() - SESSION_EXPIRE_TIME) {
            delete sessions[token];
        }
    }
}, 3600000) // 1 hour

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

    deleteSession(token: string) {
        database.sessions.deleteSession(token);
        delete sessions[token];
    },

    middleware(req: Request, res: Response, next: NextFunction) {
        var token = req.cookies['session-token']
        var session: Session|undefined = undefined;
        if (token && validator.isUUID(token)) session = sessions[token]

        if (!session) {
            res.clearCookie('session-token').status(401).json({success: false, reason: "Invalid Session Token"});
        } else {
            req.session = session;
            next();
        }
    }
}