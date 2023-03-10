import { Database } from 'sqlite3';

const db = new Database('data.db');

db.run(`CREATE TABLE IF NOT EXISTS accounts(
    id INT PRIMARY KEY, 
    username TEXT NOT NULL, 
    hash TEXT NOT NULL);`);
db.run(`CREATE TABLE IF NOT EXISTS sessions(
    id TEXT PRIMARY KEY, 
    owner INT NOT NULL, 
    created BIGINT NOT NULL, 
    lastUse BIGINT NOT NULL,
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
    username: string,
    //hash: string
}

interface Session {
    id: string,
    owner: number,
    created: number,
    lastUse: number
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

        getUser(id: number, callback: (user: Account|undefined)=>any) {
            db.get("SELECT id, username FROM accounts WHERE id = ?;", id, (err, row)=>{
                if (err) throw err;
                else callback(row);
            });
        },

        getUserWithHash(username: string, hash: string, callback: (user: Account|undefined)=>any) {
            db.get("SELECT id, username FROM accounts WHERE username = ? AND hash = ?;", [username, hash], (err, row)=>{
                if (err) throw err;
                else callback(row);
            });
        }

    },
    sessions: {
        addSession(session: Session) {
            db.run("INSERT INTO sessions (id, owner, created, lastUse) VALUES(?,?,?,?);", 
                [session.id, session.owner, session.created, session.lastUse]);
        }
    },
    media: {

    }
}