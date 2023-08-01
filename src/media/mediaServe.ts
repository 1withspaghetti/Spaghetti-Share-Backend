import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import fs from 'fs';
import path from "path";
import sharp from 'sharp';
import { FILE_TYPES } from "../api/media";

var router = Router();

router.get("*",
    query('width').optional().isInt({min: 10, max: 1000}),
    query('height').optional().isInt({min: 10, max: 1000}),
(req: Request, res: Response)=>{
    var filePath = path.join(process.cwd(), 'media/', req.path);
    var ext = path.extname(filePath).substring(1);

    const errors = validationResult(req);

    if (req.query.width && req.query.height && errors.isEmpty() && FILE_TYPES[ext]?.startsWith("image") && ext != "gif") {
        if (!fs.existsSync(filePath)) return res.status(404);
        try {
            const stream = fs.createReadStream(filePath);
            let transform = sharp({ failOnError: false });
            transform.resize(parseInt(req.query.width as string), parseInt(req.query.height as string), {fit:"inside"});
            transform.toFormat("webp");
            transform.on('error', console.error);

            res.type("webp");
            stream.pipe(transform).pipe(res).on('error', console.error);
        } catch (e) {
            console.error(e);
            res.sendFile(filePath, (err)=>{
                res.status(404).end();
            });
        }
    } else {
        res.sendFile(filePath, (err)=>{
            res.status(404).end();
        });
    }
});

router.use((req: Request, res: Response)=>{
    res.status(404).end();
})

export default router;