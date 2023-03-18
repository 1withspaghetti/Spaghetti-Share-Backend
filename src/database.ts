import { Database } from 'sqlite3';
import fs from 'fs';

import { ApiError } from './api/api';

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
    size INT NOT NULL,
    time BIGINT NOT NULL,
    tags TEXT NOT NULL,
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
    //size: number,
    time: number
    tags: string
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
        addMedia(id: number, owner: number, name: string, type: string, size: number, time: number, tags: string, callback?: ()=>any, onError?: (err: Error)=>any) {
            fs.readdir('/media', (err, files) => {
                if (err) return onError?.(err);
                if (files.length > 2000) return onError?.(new ApiError("Server has reached max capacity, please contact 1withspaghetti")); // DDOS attack prevention (max 16 GB)
                db.get("SELECT COUNT(*) FROM media WHERE owner = ?;", owner, (err, row: any)=>{
                    if (err) return onError?.(err);
                    if (row.count > 250) return onError?.(new ApiError("You have uploaded too many files! Try deleting some...")); // Limit each user to 250 files max (max 2 GB)
                    db.run("INSERT INTO media (id, owner, name, type, size, time, tags) VALUES(?,?,?,?,?,?,?);", [id, owner, name, type, size, time, tags], (err)=>{
                        if (err) onError?.(err);
                        else callback?.();
                    })
                })
            });
        },
        
        getMediaWithOwner(id: number, owner: number, callback: (data: Media)=>any, onError?: (err: Error)=>any) {
            db.get("SELECT id, name, type, time, tags FROM media WHERE id = ? AND owner = ?", [id, owner], (err, row: any)=>{
                if (err) onError?.(err);
                else callback(row as Media);
            })
        },

        searchMedia(owner: number, type: string, sizeMin: number, sizeMax: number, timeMin: number, timeMax: number, callback: (results: Media[])=>any, onError?: (err: Error)=>any) {
            var sqlItems: any[] = [owner, sizeMin, sizeMax, timeMin, timeMax];
            if (type) sqlItems.push(type);
            db.all("SELECT id, name, type, time, tags FROM media WHERE owner = ? AND size > ? AND size < ? AND time > ? AND time < ? " + (type ? "AND type = ? ":"") + "ORDER BY time LIMIT 500;", 
            sqlItems, (err, rows)=>{
                if (err) onError?.(err);
                else callback(rows as Media[]);
            })
        },

        editMedia(id: number, owner: number, name: string, tags: string, callback?: ()=>any, onError?: (err: Error)=>any) {
            db.run("UPDATE media SET name = ?, tags = ? WHERE id = ? AND owner = ?;", [name, tags, id, owner], (err)=>{
                if (err) onError?.(err);
                else callback?.();
            })
        }
    }
}