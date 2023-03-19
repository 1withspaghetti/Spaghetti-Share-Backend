import { Router, NextFunction, Request, Response } from 'express'

import auth from './auth';
import media from './media';

export class ApiError extends Error {
    reason: string;
    status?: number;

    constructor(reason: string, status?: number) {
        super("Api Error: "+reason);
        this.reason = reason;
        this.status = status;
    }
}

var router = Router();

// Authentication Endpoints
router.use("/auth", auth);
router.use("/media", media);

// 404 Not Found
router.use((req: Request, res: Response)=>{
    throw new ApiError("Not Found", 404);
})

// Error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        res.status(err.status || 400).json({success: false, reason: err.reason || "Invalid Request"})
    } else {
        console.error(err)
        res.status(500).json({success: false, reason: "Internal Server Error"})
    }
})

export default router;