import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';
import fuzzysort from 'fuzzysort';

import MediaDiskStorage from '../media/mediaDiskStorage';
import mediaId from '../media/mediaId';
import { ApiError } from './api';
import database from '../database';
import sessionService from '../session-service';
import { body, query, validationResult } from 'express-validator';
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
export const MAX_FILE_SIZE = 8388608; // 8 MB

const mediaUpload = multer({
    limits: { fileSize: MAX_FILE_SIZE, parts: 5 }, 
    storage: new MediaDiskStorage("media/"),
    fileFilter(req, file, callback) {
        var ext = path.extname(file.originalname.toLowerCase()).substring(1);
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
    const size = req.file.size;

    database.media.addMedia(req.file.customID, req.session.owner, req.file.originalname.replace(/\.([^.]+)$/, ""), req.file.fileType, size, Date.now(), "", ()=>{
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

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

    var id = mediaId.generateNewId();
    mediaUrl.downloadMedia(req.body.url, id, (path, ext, size)=>{
        console.log("File uploaded to "+path+" with id "+id);
        database.media.addMedia(id, req.session.owner, "Unnamed File", ext, size, Date.now(), "", ()=>{}, (err)=>{
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

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

    if (!(typeof req.query.id === 'string')) throw new ApiError("Invalid Id");
    var id = mediaId.base64ToId(req.query.id);
    var progress = mediaUrl.getProgress(id);
    if (!progress) throw new ApiError("Invalid Id");
    res.json({success: true, progress: progress});
})

router.get('/data', sessionService.middleware,
    query('id').isHexadecimal().isLength({min: 8, max: 8}), 
(req: Request, res: Response, next: NextFunction)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

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

router.get('/search', sessionService.middleware,
    query('search').optional().isAlphanumeric(),
    query('type').optional().isAlphanumeric().isIn(Object.keys(FILE_TYPES)),
    query('sizeMin').optional().isInt(),
    query('sizeMax').optional().isInt(),
    query('dateMin').optional().isDate(),
    query('dateMax').optional().isDate(),
(req: Request, res: Response, next: NextFunction)=>{
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError("Invalid "+errors.array({onlyFirstError: true})[0].param);

    // TODO: Get results from database
    database.media.searchMedia(req.session.owner, 
        req.query.type ? req.query.type as string : "", 
        req.query.sizeMin ? parseFloat(req.query.sizeMin as string)*1048576 : 0, 
        req.query.sizeMax ? parseFloat(req.query.sizeMax as string)*1048576 : MAX_FILE_SIZE,
        req.query.dateMin ? new Date(req.query.dateMin as string).getTime() : 0,
        req.query.dateMax ? new Date(req.query.dateMax as string).getTime() : 9223372036854775807,
    (results: any[])=>{
        results = results.map(obj => {return {...obj, id: mediaId.idToBase64(obj.id)}})
        if (req.query.search && typeof req.query.search === 'string') {
            var sorted = fuzzysort.go(req.query.search, results, {keys: ['name', 'tags'], threshold: -10000});
            res.json({success: true, results: sorted.map(item => item.obj)});
        } else {
            res.json({success: true, results: results});
        }
    }, next)
});

export default router;
