import { Request } from 'express';
import { StorageEngine } from 'multer'
import path from 'path';
import fs from 'fs';

import mediaId from './mediaId';
import { ApiError } from '../api/api';

declare global {
    namespace Express.Multer {
        interface File {
            customID: number;
        }
    }
}

export default class MediaDiskStorage implements StorageEngine {

    destination: string;

    constructor(destination: string) {
        this.destination = destination;
        if (!fs.existsSync(this.destination)) fs.mkdirSync(this.destination);
    }

    _handleFile(req: Request, file: Express.Multer.File, callback: (error?: any, info?: Partial<Express.Multer.File> | undefined) => void): void {
        var id = mediaId.generateNewId();
        var filename = mediaId.idToBase64(id);
        
        var finalPath = path.join(this.destination, filename);
        var outStream = fs.createWriteStream(finalPath);

        file.stream.pipe(outStream)
        outStream.on('error', ()=>{
            fs.unlink(finalPath, ()=>{
                callback(new ApiError("File Stream Closed"));
            });
        });
        outStream.on('finish', () => {
            callback(null, {
                customID: id,
                destination: this.destination,
                filename: filename,
                path: finalPath,
                size: outStream.bytesWritten
            })
        });
        req.on('aborted', function() {
            outStream.close();
            fs.unlink(finalPath, ()=>{
                callback(new ApiError("Request Steam Closed"))
            });
        });
    }
    _removeFile(req: Request, file: Express.Multer.File, callback: (error: Error | null) => void): void {
        var path = file.path

        fs.unlink(path, callback);
    }
    
}