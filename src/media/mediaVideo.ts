import ffmpegStatic from 'ffmpeg-static'
import { FILE_TYPES } from '../api/media';
import { exec } from 'child_process';

export default {
    generateThumbnailIfVideo(path: string, type: string, callback: ()=>any, onError: (err: Error)=>any) {
        if (!ffmpegStatic) return onError(new Error("ffmpeg does not exist"));
        if (!FILE_TYPES[type].startsWith("video")) return callback();

        exec(`${ffmpegStatic} -i ${path} -ss 00:00:00.000 -vframes 1 ${path+'.jpg'}`, (err, stdout)=>{
            if (err) return onError(err);
            callback();
        });
    }
}