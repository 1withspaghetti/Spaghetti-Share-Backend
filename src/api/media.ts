import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';

import MediaDiskStorage from '../media/mediaDiskStorage';
import mediaId from '../media/mediaId';
import { ApiError } from './api';
import database from '../database';
import sessionService from '../session-service';
import { body, query } from 'express-validator';
import mediaUrl from '../media/mediaUrl';

export const FILE_TYPES: {[key: string]: string} = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm"
}
export const MAX_FILE_SIZE = 8000000; // 8 mb

const mediaUpload = multer({
    limits: { fileSize: MAX_FILE_SIZE, parts: 5 }, 
    storage: new MediaDiskStorage("media/"),
    fileFilter(req, file, callback) {
        var ext = path.extname(file.originalname).substring(1);
        if (Object.keys(FILE_TYPES).includes(ext))
            callback(null, true);
        else
            callback(new ApiError("Unknown File Type"));
    },
});

var router = Router();

router.post('/upload', sessionService.middleware, mediaUpload.single('media'), (req: Request, res: Response, next: NextFunction)=>{
    if (!req.file) throw new ApiError("Error uploading file");
    console.log("File uploaded to "+req.file.path+" with id "+req.file.customID);

    const id = req.file.customID;
    const path = req.file.path;

    database.media.addMedia(req.file.customID, req.session.owner, req.file.originalname.replace(/\.([^.]+)$/, ""), req.file.fileType, Date.now(), ()=>{
        res.json({success: true, id: mediaId.idToBase64(id)});
    }, (err)=>{
        // In case of database error, remove file to prevent clogging
        fs.unlinkSync(path);
        next(err);
    });
})

router.post('/upload/url', sessionService.middleware, 
    body('url').exists().isURL({require_protocol: true, protocols: ['http', 'https']}), 
(req: Request, res: Response, next: NextFunction)=>{

    var id = mediaId.generateNewId();
    mediaUrl.downloadMedia(req.body.url, id, (path, ext)=>{
        console.log("File uploaded to "+path+" with id "+id);
        database.media.addMedia(id, req.session.owner, "Unnamed File", ext, Date.now(), ()=>{}, (err)=>{
            // In case of database error, remove file to prevent clogging
            fs.unlinkSync(path);
            next(err);
        });  
    }).then(()=>{
        res.json({success: true, id: mediaId.idToBase64(id)});
    }, next).catch(next)
});

router.get('/upload/progress', sessionService.middleware, 
    query('id').isHexadecimal().isLength({min: 2, max: 10}), 
(req: Request, res: Response)=>{
    if (!(typeof req.query.id === 'string')) throw new ApiError("Invalid Id");
    var id = mediaId.base64ToId(req.query.id);
    var progress = mediaUrl.getProgress(id);
    if (!progress) throw new ApiError("Invalid Id");
    res.json({success: true, progress: progress});
})

router.get('/data', sessionService.middleware,
    query('id').isHexadecimal().isLength({min: 8, max: 8}), 
(req: Request, res: Response, next: NextFunction)=>{
    if (!(typeof req.query.id === 'string')) throw new ApiError("Invalid Id");
    var id = mediaId.base64ToId(req.query.id);
    database.media.getMediaWithOwner(id, req.session.owner, (data: any)=>{
        if (!data) next(new ApiError("Media does not exist"));
        else {
            data.id = mediaId.idToBase64(data.id);
            res.json({success: true, media: data});
        }
    }, next)
});

export default router;
