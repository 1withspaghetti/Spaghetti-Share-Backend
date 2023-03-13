import request from 'supertest';
import { Database } from 'sqlite3';

import { app, server } from '../src/index';

describe("User Authentication", ()=>{
    it("Creating an account via /api/v1/auth/register", async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({email: 'test@test.com', username: 'test', password: 'password123'})

        expect(res.body).toMatchObject({success: true});
    });

    var cookie = "";

    it("Login via /api/v1/auth/login", async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({username: 'test', password: 'password123'})
        expect(res.body).toMatchObject({success: true});
        cookie = res.headers['set-cookie'][0];
        expect(cookie).toContain("session-token");
    });

    it("Refresh token via /api/v1/auth/refresh", async () => {
        const res = await request(app)
            .get('/api/v1/auth/refresh')
            .set('Cookie', cookie)
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({success: true});
    });
});

beforeAll((done)=>{
    const db = new Database('data.db');
    db.run("DELETE FROM accounts WHERE username = ?;", "test", ()=>{
        db.close(done);
    });
});

afterAll((done)=>{
    server.close(()=>{
        const db = new Database('data.db');
        db.run("DELETE FROM accounts WHERE username = ?;", "test", ()=>{
            db.close(done);
        });
    });
});
