import { randomUUID } from "crypto";
import validator from 'validator'

import database, { Session } from "./database";

var sessions: {[key: string]: Session} = {};

export const SESSION_EXPIRE_TIME = 604800000; // 7 Days

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
    }
}