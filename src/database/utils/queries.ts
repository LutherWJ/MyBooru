import {Err, Ok, type ParserError, type Result, type SearchQuery} from "../../shared/types.ts";

/**
 * Checks if a character is whitespace.
 * Automatically returns false if more than one character is provided
 */
export const isWhitespace = (char: string): boolean => {
    if (char.length !== 1) return false;

    const code = char.charCodeAt(0);

    // Space, tab, newline, carriage return
    return code === 32 || code === 9 || code === 10 || code === 13;
};

/**
 * Validates if a character is allowed in a danbooru tag name.
 * Automatically returns false if more than one character is provided.
 *
 * According to Danbooru tag restrictions:
 * - Allowed: Most printable ASCII characters (!"#$%&'()+-./0-9:;<=>?@A-Z[\]^_`a-z{|}~)
 * - Disallowed: asterisks (*), commas (,), and whitespace
 * - Note: Additional positional restrictions (like no leading -, ~, or _) are NOT checked here
 */
export const isValidChar = (char: string): boolean => {
    if (char.length !== 1) return false;

    const code = char.charCodeAt(0);

    // Check for disallowed characters: asterisk (42), comma (44), and whitespace
    if (code === 42 || code === 44 || isWhitespace(char)) {
        return false;
    }

    // Allow printable ASCII characters (33-126), excluding the disallowed ones above
    return code >= 33 && code <= 126;
};

export const parseQuery = (query: string): Result<SearchQuery, ParserError> => {
    let pc = 0;
    let qry: SearchQuery = {
        includeTags: [],
        optionalTags: [],
        excludeTags: [],
        rating: [],
    };
    let isOptional = false;

    // Should start at the first character of the tag (must be a valid tag character)
    // Should leave off at the next spacebar
    const parseTag = (): Result<string, ParserError> => {
        let word = '';
        while (true){
            const char = query.charAt(pc);
            pc++;
            if (isValidChar(char)) {
                word += char;
            } else if (isWhitespace(char)) {
                return Ok(word);
            } else {
                return Err({
                    type: 'invalid_character',
                    message: `Found invalid character "${char}" while parsing tag,`
                });
            }
        }
    }

    while (pc < query.length) {
        const char = query.charAt(pc);
        if (isWhitespace(char)) {
            pc++;
        } else if (char === '-') {
            pc++
            const res = parseTag();
            if (!res.ok) {
                return res;
            }
            qry.excludeTags!.push(res.value)
        } else if (char === '~') {
            const res = parseTag();
            if (!res.ok) {
                return res;
            }
            qry.optionalTags!.push(res.value);
        } else if (isValidChar(char)) {
            const res = parseTag();
            if (!res.ok) {
                return res;
            }

            if (res.value === 'or') {
                isOptional = true;
            } else if (isOptional) {
                qry.optionalTags!.push(res.value);
                isOptional = false;
            } else {
                qry.includeTags!.push(res.value)
            }
        } else {
            return Err({
                type: 'invalid_character',
                message: `Found invalid character "${char} while parsing query`
            })
        }
    }
    return Ok(qry);
}

