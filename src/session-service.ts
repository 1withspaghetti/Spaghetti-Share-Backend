import { randomUUID } from "crypto";
import validator from 'validator'

import database, { Session } from "./database";

var sessions: {[key: string]: Session} = {};

export default {
    createSession(userId: number): Session {
        var id = randomUUID();
        var session: Session = {
            id: id,
            owner: userId,
            created: Date.now(),
            lastUse: Date.now()
        }
        sessions[id] = session;
        database.sessions.addSession(session);
        return session;
    },

    getSession(id: string, markAsUse: boolean = false): Session | undefined {
        if (!validator.isUUID(id)) return undefined;
        var session = sessions[id];
        if (!session) return undefined;
        return session;
    }
}