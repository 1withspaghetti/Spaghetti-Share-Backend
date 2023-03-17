import axios, { AxiosResponse } from "axios"
import mediaId from "./mediaId"
import { FILE_TYPES, MAX_FILE_SIZE } from "../api/media"
import { ApiError } from "../api/api"
import path from "path"
import fs from "fs"
import { Stream } from "stream"

export type Progress = {
    completed: boolean,
    error: boolean,
    value: number,
    started: number
}

var progressMap: {[key: string]: Progress} = {}

setInterval(()=>{
    for (let key of Object.keys(progressMap)) {
        if (progressMap[key].started < Date.now() - 300000) // Expires after 5 minutes
            delete progressMap[key];
    }
}, 60000)

export default {
    /**
     * Returns one the download has started, and runs the callback once it is finished
     */
    async downloadMedia(url: string, id: number, callback: (path: string, ext: string, size: number)=>any) {

        var res = await axios.head(url)

        this.verifyHeaders(res);

        progressMap[id] = {
            completed: false,
            error: false,
            value: 0,
            started: Date.now()
        }

        var res = await axios.get(url, {
            responseType: 'stream',
        });

        const {ext, size} = this.verifyHeaders(res);

        const file = path.join('media', mediaId.idToBase64(id)+"."+ext);
        const fileStream = fs.createWriteStream(file);

        var bytes = 0;

        var dataStream = (res.data as Stream)
        dataStream.on('data',(chunk)=>{
            bytes += chunk.length;
            progressMap[id].value = bytes / size;
        });
        dataStream.on('error', (err)=>{
            fs.unlinkSync(file);
            progressMap[id].error = true;
            console.error(err);
        });
        dataStream.pipe(fileStream);

        fileStream.on('error', (err)=>{
            fs.unlinkSync(file);
            progressMap[id].error = true;
            console.error(err);
        });
        fileStream.on('finish', ()=>{
            fileStream.close();
            progressMap[id].completed = true;
            callback(file, ext, size);
        })

        return;
    },

    verifyHeaders(res: AxiosResponse<any, any>) {
        if (!(typeof res.headers["content-type"] === 'string')) throw new ApiError("Unknown media format");
        var ext = Object.keys(FILE_TYPES).find(key => FILE_TYPES[key] === res.headers["content-type"]);
        if (!ext) throw new ApiError("Unknown media format");

        var contentLength = res.headers["content-length"];
        if (typeof contentLength === 'string') contentLength = parseInt(contentLength);
        if (!(typeof contentLength === 'number')) throw new ApiError("Unknown file size");
        const size = contentLength;
        if (size > MAX_FILE_SIZE) throw new ApiError("File size must be under 8mb");

        return {ext, size};
    },

    getProgress(id: number): Progress|undefined {
        return progressMap[id];
    }
}