import { Router, NextFunction, Request, Response } from 'express'
import { body } from 'express-validator';

import database from './database';

var router = Router();

class ApiError extends Error {
    reason: string;
    status?: number;

    constructor(reason: string, status?: number) {
        super("Api Error: "+reason);
        this.reason = reason;
        this.status = status;
    }
}


router.post("/auth/login", 
    body('username').exists().matches(/^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/), 
    body('password').exists().matches(/"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,32}$"/),
(req: Request, res: Response)=>{
    
    
})



// Error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        res.status(err.status || 400).json({success: false, reason: err.reason || "Invalid Request"})
    } else {
        console.error(err.stack)
        res.status(500).json({success: false, reason: "Internal Server Error"})
    }
})

export default router;