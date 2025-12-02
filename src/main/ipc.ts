import { ipcMain } from "electron/main";
import {Ok, Err} from './../shared/types'
import type { SearchQuery } from "../shared/types";
import {uploadMedia} from "./upload.ts";
import * as stream from "node:stream";


ipcMain.handle('media:search', (_event, query: string, page: number) => {
    const parsed = parseQuery(query);
    if (!parsed.ok) {
        return Err({
            type: 'parsing_error',
            message: 'Invalid query syntax',
            originalError: parsed.error
        });
    }
    return Ok(parsed.value);
});

ipcMain.handle('upload:single', uploadMedia(stream));
