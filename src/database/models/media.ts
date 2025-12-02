import type {Database, DatabaseError} from "../types.ts";
import type {Media} from "../../renderer/types";
import {DEFAULT_PAGINATION_LIMIT} from "../../shared/constants.ts";
import type {CreateMediaInput, Result, SearchQuery} from "../../shared/types.ts";
import {Ok, Err} from "../../shared/types.ts";
import {mapArrayToMedia, mapToMedia} from "../utils/mappers.ts";

export const getAllPaginatedMedia = (db: Database, offset: number, limit: number = DEFAULT_PAGINATION_LIMIT): Result<Media[], DatabaseError> => {
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
        const res = db.prepare(`SELECT * FROM MEDIA WHERE ID > ?`).all(id);
        return Ok(mapToMedia(res));
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to fetch media',
            originalError: e
        })
    }
}

export const getPaginatedMediaBySearch = (query: SearchQuery) => {

}

// Returns media ID on success
export const createMedia = (db: Database, media: CreateMediaInput): Result<number, DatabaseError> => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const info = db.prepare(`
            INSERT INTO media (
                file_path,
                original_path,
                md5,
                media_type,
                mime_type,
                file_size,
                width,
                height,
                duration,
                codec,
                rating,
                parent_id,
                source_url,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            media.file_path,
            media.original_path,
            media.md5,
            media.media_type,
            media.mime_type,
            media.file_size,
            media.width,
            media.height,
            media.duration,
            media.codec,
            media.rating,
            media.parent_id,
            media.source_url,
            now,
            now
        );
        return Ok(info.lastInsertRowid as number);
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return Err({
                type: 'constraint_violation',
                message: `Media with MD5 ${media.md5} already exists`,
            });
        }
        return Err({
            type: 'database_error',
            message: 'Failed to create media',
            originalError: error,
        });
    }
}
