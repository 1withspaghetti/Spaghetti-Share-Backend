import express, { Express } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import api from './api'

dotenv.config();

const app: Express = express();
const port = process.env.port || 8080;

// Server static files from ./public
app.use('/', express.static('public'));

// Set up body parsing
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Use api routes imported from api.ts
app.use("/api/v1", api);

const server = app.listen(port, ()=>{
  console.log(`
        ▄▄▄▄▄███▄▄▄▄
      ▄█▀           ▀▀▄        ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▄
     █▌                █      █   Spaghetti Share!   █
   ▄████████████████████       ▀▄   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀
  ██░░█▀▀         ▀▀██         ▄▀ ▄▀
▄██░░░█▌    █▌    ▄▄▄██      ▄█▄▀▀
▀█▄░░██     █▌ ▄▄█▀   ▀▀█▄      
  ▀▀▀█         █     ▄▄▄█▀
      █▌        ▀▀▀▀█▀▀
      ▀█▄         ▄▀
        █        █▀
  `);
  console.log("Backend Server Started");
});

export {app, server};