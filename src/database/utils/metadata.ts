import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {getFfprobePath} from "../../shared/utils";
import {Err, type FFprobeMetadata, Ok, type Result, type MetadataError} from "../../shared/types";

const exec = promisify(execFile);

export async function getMultimediaMetadata(path: string): Promise<Result<FFprobeMetadata, MetadataError>> {
    const ffprobe = getFfprobePath();
    const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', path];

    try {
        const {stdout} = await exec(ffprobe, args);
        const result = JSON.parse(stdout);
        return Ok({
            codec: result.streams[0].codec_name,
            width: result.streams[0].width || null,
            height: result.streams[0].height || null,
            duration: result.streams[0].duration || null,
            file_size: result.format.size,
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return Err({
                type: 'file_not_found',
                message: `File not found: ${path}`,
                path,
            });
        }

        if (error.message?.includes('Invalid data found')) {
            return Err({
                type: 'invalid_file',
                message: `Invalid or corrupted media file: ${path}`,
                path,
            });
        }

        return Err({
            type: 'ffprobe_error',
            message: `Failed to extract metadata: ${error.message || 'Unknown error'}`,
            path,
            originalError: error,
        });
    }
}
