import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';

import MediaDiskStorage from '../media/mediaDiskStorage';
import mediaId from '../media/mediaId';
import { ApiError } from './api';
import database from '../database';
import sessionService from '../session-service';

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

router.post('/upload', sessionService.middleware, mediaUpload.single('media'), (req: Request, res: Response)=>{
    if (!req.file) throw new ApiError("Error uploading file");
    console.log("File uploaded to "+req.file.path+" with id "+req.file.customID);

    try {
        database.media.addMedia(req.file.customID, req.session.owner, req.file.originalname.replace(/\.([^.]+)$/, ""), req.file.fileType, Date.now(), ()=>{
            if (!req.file) throw new ApiError("Error uploading file");
            res.json({success: true, id: mediaId.idToBase64(req.file.customID)});
        });
    } catch(err) {
        // In case of database error, remove file to prevent clogging
        fs.unlinkSync(req.file.path);
        throw new ApiError("Error uploading file");
    }
})

export default router;
