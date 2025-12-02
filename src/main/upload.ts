import {Ok, Err, type Result, type FileSystemError} from '../shared/types.ts';
import {writeFile} from 'node:fs/promises'
import {pipeline} from 'node:stream/promises'
import {Readable} from 'node:stream';
import {createWriteStream} from 'node:fs'
import {createHash} from "node:crypto";
import {calculateStreamMD5} from "../database/utils/hash.ts";
import {getMediaFilePath} from "../shared/utils";

const generateFileName = (): string => {
    return `media${Date.now().toString()}.pending`
}

const makeMediaFile = async (data: Readable, path: string): Promise<Result<void, FileSystemError>> => {
    try {
        await pipeline(data, createWriteStream(path));
    } catch (e) {
        return Err({
            type: 'io_error',
            message: `Could not create media file: ${path}`,
            path: path,
            originalError: e
        });
    }
    return Ok(undefined);
}

export const uploadMedia = async (stream: Readable): Promise<Result<void, FileSystemError>> => {
    const name = generateFileName();
    const md5 = await calculateStreamMD5(stream);
    const path = getMediaFilePath(md5, name);
    return await makeMediaFile(stream, path)
}
