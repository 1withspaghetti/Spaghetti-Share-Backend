import express, { Express } from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

dotenv.config();

const app: Express = express();
const port = process.env.port;

app.use('/', express.static('public'));

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



app.listen(port, ()=>{
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
})