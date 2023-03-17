import { Database } from 'sqlite3';

const db = new Database('data.db');

db.run(`CREATE TABLE IF NOT EXISTS accounts(
    id BIGINT PRIMARY KEY, 
    email TEXT NOT NULL,
    username TEXT NOT NULL, 
    hash TEXT NOT NULL);`);
db.run(`CREATE TABLE IF NOT EXISTS sessions(
    token TEXT PRIMARY KEY, 
    owner INT NOT NULL, 
    created BIGINT NOT NULL, 
    lastRefresh BIGINT NOT NULL,
    FOREIGN KEY(owner) REFERENCES accounts(id));`);
db.run(`CREATE TABLE IF NOT EXISTS media(
    id INT PRIMARY KEY, 
    owner INT NOT NULL, 
    name TEXT NOT NULL, 
    type TEXT NOT NULL, 
    time BIGINT NOT NULL,
    FOREIGN KEY(owner) REFERENCES accounts(id));`);

console.log("Connected to sqlite database");

interface Account {
    id: number,
    email: string,
    username: string,
    //hash: string
}

interface Session {
    token: string,
    owner: number,
    created: number,
    lastRefresh: number
}

interface Media {
    id: number,
    //owner: number,
    name: string,
    type: string,
    time: number
}
export {
    Account,
    Session,
    Media
}
export default {
    accounts: {

        getUser(id: number, callback: (user: Account|undefined)=>any, onError?: (err: Error)=>any) {
            db.get("SELECT id, username FROM accounts WHERE id = ?;", id, (err, row: any)=>{
                if (err) onError?.(err);
                else callback(row);
            });
        },

        getUserWithHash(emailOrUsername: string, hash: string, callback: (user: Account|undefined)=>any, onError?: (err: Error)=>any) {
            db.get("SELECT id, username FROM accounts WHERE (username = ? OR email = ?) AND hash = ?;", [emailOrUsername, emailOrUsername, hash], (err, row: any)=>{
                if (err) onError?.(err);
                else callback(row);
            });
        },

        checkUsername(username: string, callback: (exists: boolean)=>any, onError?: (err: Error)=>any) {
            db.get("SELECT COUNT(*) as count FROM accounts WHERE username = ?;", username, (err, row: any)=>{
                if (err) onError?.(err);
                else callback(row.count > 0);
            });
        },

        createUser(id: number, email: string, username: string, hash: string, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("INSERT INTO accounts (id, email, username, hash) VALUES(?,?,?,?);", [id, email, username, hash], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            })
        },

    },
    sessions: {
        addSession(session: Session, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("INSERT INTO sessions (token, owner, created, lastRefresh) VALUES(?,?,?,?);", 
                [session.token, session.owner, session.created, session.lastRefresh], (err)=>{
                    if (err) onError?.(err);
                    else callback?.();
                });
        },

        refreshSession(token: string, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("UPDATE sessions SET lastRefresh = ? WHERE token = ?;", [Date.now(), token], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            });
        },

        getSessions(callback: (rows: Session[])=>any, onError?: (err: Error)=>any) {
            db.all("SELECT token, owner, created, lastRefresh FROM sessions;", (err, rows: any[])=>{
                if (err) onError?.(err);
                else callback(rows);
            })
        },

        deleteSession(token: string, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("DELETE FROM sessions WHERE token = ?;", [token], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            });
        },

        purgeSessions(maxAge: number, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("DELETE FROM sessions WHERE lastRefresh <= ?;", [Date.now() - maxAge], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            });
        }
    },
    media: {
        addMedia(id: number, owner: number, name: string, type: string, time: number, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("INSERT INTO media (id, owner, name, type, time) VALUES(?,?,?,?,?);", [id, owner, name, type, time], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            })
        },
        
        getMediaWithOwner(id: number, owner: number, callback: (data: Media)=>any, onError?: (err: Error)=>any) {
            db.get("SELECT id, name, type, time FROM media WHERE id = ? AND owner = ?", [id, owner], (err, row: any)=>{
                if (err) onError?.(err);
                else callback(row as Media);
            })
        }
    }
}