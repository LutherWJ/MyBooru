import {Ok, Err, type Result, type Tag, TagCategory} from "../../shared/types.ts";
import type {Database, DatabaseError} from "../types.ts";
import {mapArrayToTags, mapToTag} from "../utils/mappers.ts";
import {DEFAULT_PAGINATION_LIMIT} from "../../shared/constants.ts";

export const getAllTags = (
    db: Database,
    offset: number,
    limit: number = DEFAULT_PAGINATION_LIMIT
): Result<Tag[], DatabaseError> => {
    try {
        const id = offset * limit
        const data = db.prepare(`
        SELECT * FROM TAGS
        WHERE ID < ? ORDER BY id DESC LIMIT ?`).all(id, limit);
        const tags = mapArrayToTags(data);
        return Ok(tags);
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to fetch tags',
            originalError: e
        });
    }
}

export const getTagByID = (db: Database, id: number): Result<Tag, DatabaseError> => {
    try {
        const result = db.prepare(`SELECT * FROM tags WHERE id=?`).get(id);
        return Ok(mapToTag(result));
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to fetch tag',
            originalError: e
        })
    }
}

export const createTag = (db: Database, name: string, category: TagCategory): Result<void, DatabaseError> => {
    try {
        db.prepare(`
            INSERT INTO TAGS
            VALUES (name categoryusage_count) 
            (?, ?, 0)`).run(name, category);
        return Ok(undefined);
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to insert tag',
            originalError: e
        })
    }
}

export const createTagAlias = (db: Database, tagName: string, alias: string): Result<void, DatabaseError> => {
    try {
        db.prepare(`
        INSERT INTO tag_aliases VALUES (antecedent_name, consequent_name) (?, ?)`).run(tagName, alias);
        return Ok(undefined);
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to create tag alias',
            originalError: e
        })
    }
}

export const addTagToMedia = (db: Database, mediaID: number, tagID: string): Result<void, DatabaseError> => {
    try {
        db.prepare(`INSERT INTO media_tags VALUES (media_id, tag_id) VALUES (?, ?)`).run(mediaID, tagID);
        return Ok(undefined);
    } catch (e) {
        return Err({
            type: 'database_error',
            message: 'Failed to add tag to media',
            originalError: e
        })
    }
}
