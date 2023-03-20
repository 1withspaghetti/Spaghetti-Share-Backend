import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import api from './api/api'
import path from 'path'
import mediaServe from './media/mediaServe'

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

// Uploaded files
app.use('/media', mediaServe);

// Default to index for single page app
app.use((req: Request, res: Response)=>{
  res.sendFile(path.join(__dirname,'../public/index.html'))
});

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
  console.log("Backend Server Started | Port "+port);
});

export {app, server};