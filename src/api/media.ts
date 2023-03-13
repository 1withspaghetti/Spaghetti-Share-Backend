import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import MediaDiskStorage from '../media/mediaDiskStorage';
import mediaId from '../media/mediaId';
import { ApiError } from './api';

const MAX_FILE_SIZE = 8000000; // 8 mb
const mediaUpload = multer({
    limits: { fileSize: MAX_FILE_SIZE, parts: 5 }, 
    storage: new MediaDiskStorage("media/")
});

var router = Router();

router.post('/upload', mediaUpload.single('media'), (req: Request, res: Response)=>{
    if (!req.file) throw new ApiError("Error uploading file");
    console.log("File uploaded to "+req.file.path+" with id "+req.file.customID);

    res.json({success: true, id: mediaId.idToBase64(req.file.customID)});
})

export default router;
