import type {Database, DatabaseError} from "../types.ts";
import type {Media} from "../../renderer/types";
import {DEFAULT_PAGINATION_LIMIT} from "../../shared/constants.ts";
import type {Result} from "../../shared/types.ts";
import {Ok, Err} from "../../shared/types.ts";
import {mapArrayToMedia, mapToMedia} from "../utils/mappers.ts";

export const getAllMedia = (db: Database, offset: number, limit: number = DEFAULT_PAGINATION_LIMIT): Result<Media[], DatabaseError> => {
    try{
        const idOffset = offset * limit;
        const res = db.prepare(`SELECT * FROM MEDIA WHERE ID > ? LIMIT ?`).all(idOffset, limit);
        return Ok(mapArrayToMedia(res));
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to fetch media',
            originalError: e
        })
    }
}

export const getMediaByID = (db: Database, id: number): Result<Media, DatabaseError> => {
    try{
        const res = db.prepare(`SELECT * * FROM MEDIA WHERE ID > ?`).all(id);
        return Ok(mapToMedia(res));
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to fetch media',
            originalError: e
        })
    }
}

export const createMedia = (db: Database, media: Uint8Array) => {

}
