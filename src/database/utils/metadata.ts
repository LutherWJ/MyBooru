import { Ok, Err, type Result } from '../../shared/types';
import type { MetadataError } from '../types';

const generateFileName = (fileExt: string): string => {
    return `media${Date.now().toString()}.${fileExt}`
}

/**
 * Optimized MIME type detection using a decision tree.
 * Narrows down possibilities byte-by-byte to minimize comparisons.
 */
const detectMIMEType = (b: Uint8Array): Result<string, MetadataError> => {
    if (buffer.length < 4) {
        return Err({
            type: 'insufficient_data',
            message: 'Buffer too small to detect MIME type (need at least 4 bytes)'
        });
    }

    // Decision tree based on first byte
    switch (b[0]) {
        case 0x00:
            if (b.length >= 4) {
                // ICO: 00 00 01 00
                if (b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) {
                    return Ok('image/x-icon');
                }
                // MPEG: 00 00 01 BA or 00 00 01 B3
                if (b[1] === 0x00 && b[2] === 0x01) {
                    if (b[3] === 0xBA || b[3] === 0xB3) {
                        return Ok('video/mpeg');
                    }
                }
            }
            break;

        case 0x1A: // EBML (WebM/MKV)
            if (b.length >= 4 && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) {
                // Check doctype if available
                if (b.length >= 40) {
                    const doctype = String.fromCharCode(...b.slice(31, 35));
                    if (doctype === 'webm') return Ok('video/webm');
                    if (doctype.startsWith('matro')) return Ok('video/x-matroska');
                }
                return Ok('video/webm'); // default
            }
            break;

        case 0x30: // WMA (ASF container)
            if (b.length >= 16 &&
                b[1] === 0x26 && b[2] === 0xB2 && b[3] === 0x75 &&
                b[4] === 0x8E && b[5] === 0x66 && b[6] === 0xCF && b[7] === 0x11 &&
                b[8] === 0xA6 && b[9] === 0xD9 && b[10] === 0x00 && b[11] === 0xAA &&
                b[12] === 0x00 && b[13] === 0x62 && b[14] === 0xCE && b[15] === 0x6C) {
                return Ok('audio/x-ms-wma');
            }
            break;

        case 0x38: // PSD
            if (b.length >= 4 && b[1] === 0x42 && b[2] === 0x50 && b[3] === 0x53) {
                return Ok('image/vnd.adobe.photoshop');
            }
            break;

        case 0x3C: // SVG: < (XML/SVG)
            if (b.length >= 5) {
                // <?xml or <svg
                const start = String.fromCharCode(...b.slice(0, 5));
                if (start === '<?xml') return Ok('image/svg+xml');
                if (start.startsWith('<svg')) return Ok('image/svg+xml');
            }
            break;

        case 0x42: // BMP
            if (b[1] === 0x4D) {
                return Ok('image/bmp');
            }
            break;

        case 0x46: // FLV or FORM (AIFF)
            if (b.length >= 4) {
                // FLV: 46 4C 56
                if (b[1] === 0x4C && b[2] === 0x56) {
                    return Ok('video/x-flv');
                }
                // AIFF: 46 4F 52 4D .... 41 49 46 46 (FORM....AIFF)
                if (b.length >= 12 &&
                    b[1] === 0x4F && b[2] === 0x52 && b[3] === 0x4D &&
                    b[8] === 0x41 && b[9] === 0x49 && b[10] === 0x46 && b[11] === 0x46) {
                    return Ok('audio/aiff');
                }
            }
            break;

        case 0x47: // GIF
            if (b.length >= 4 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
                return Ok('image/gif');
            }
            break;

        case 0x49: // TIFF (little-endian) or ID3 (MP3)
            if (b.length >= 4) {
                // TIFF: 49 49 2A 00
                if (b[1] === 0x49 && b[2] === 0x2A && b[3] === 0x00) {
                    return Ok('image/tiff');
                }
                // MP3 ID3v2: 49 44 33
                if (b[1] === 0x44 && b[2] === 0x33) {
                    return Ok('audio/mpeg');
                }
            }
            break;

        case 0x4D: // TIFF (big-endian), MIDI, or APE
            if (b.length >= 4) {
                // TIFF: 4D 4D 00 2A
                if (b[1] === 0x4D && b[2] === 0x00 && b[3] === 0x2A) {
                    return Ok('image/tiff');
                }
                // MIDI: 4D 54 68 64
                if (b[1] === 0x54 && b[2] === 0x68 && b[3] === 0x64) {
                    return Ok('audio/midi');
                }
                // APE: 4D 41 43 20
                if (b[1] === 0x41 && b[2] === 0x43 && b[3] === 0x20) {
                    return Ok('audio/ape');
                }
            }
            break;

        case 0x4F: // OGG
            if (b.length >= 4 && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) {
                return Ok('audio/ogg');
            }
            break;

        case 0x52: // RIFF container (WebP, AVI, WAV)
            if (b.length >= 12 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) {
                // Check RIFF type at offset 8
                // WebP
                if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
                    return Ok('image/webp');
                }
                // AVI
                if (b[8] === 0x41 && b[9] === 0x56 && b[10] === 0x49 && b[11] === 0x20) {
                    return Ok('video/x-msvideo');
                }
                // WAV
                if (b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45) {
                    return Ok('audio/wav');
                }
            }
            break;

        case 0x66: // FLAC
            if (b.length >= 4 && b[1] === 0x4C && b[2] === 0x61 && b[3] === 0x43) {
                return Ok('audio/flac');
            }
            break;

        case 0x89: // PNG
            if (b.length >= 8 &&
                b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
                b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) {
                return Ok('image/png');
            }
            break;

        case 0xFF: // JPEG or MP3
            if (b.length >= 3) {
                // JPEG: FF D8 FF
                if (b[1] === 0xD8 && b[2] === 0xFF) {
                    return Ok('image/jpeg');
                }
                // MP3 MPEG sync: FF FB, FF F3, FF F2
                if (b[1] === 0xFB || b[1] === 0xF3 || b[1] === 0xF2) {
                    return Ok('audio/mpeg');
                }
            }
            break;

        default:
            // Check for ISO Base Media formats
            // These have ftyp box at offset 4
            if (b.length >= 12 &&
                b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) { // 'ftyp'

                const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);

                // Image formats
                if (brand === 'avif' || brand === 'avis') return Ok('image/avif');
                if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx') {
                    return Ok('image/heic');
                }
                if (brand === 'mif1' || brand === 'msf1') return Ok('image/heif');

                // Video formats
                if (['isom', 'iso2', 'mp41', 'mp42', 'M4V ', 'f4v ', 'dash', 'iso5', 'iso6'].includes(brand)) {
                    return Ok('video/mp4');
                }
                if (brand === 'qt  ') return Ok('video/quicktime');
                if (brand.startsWith('3g')) return Ok('video/3gpp');

                // Audio formats
                if (brand === 'M4A ') return Ok('audio/mp4');
            }

            // Check for QuickTime moov atom at offset 4
            if (b.length >= 8 && b[4] === 0x6D && b[5] === 0x6F && b[6] === 0x6F && b[7] === 0x76) {
                return Ok('video/quicktime');
            }
            break;
    }

    return Err({
        type: 'unsupported_mime',
        message: `Unsupported or unrecognized file format. First bytes: ${Array.from(b.slice(0, 16)).map(byte => byte.toString(16).padStart(2, '0')).join(' ')}`
    });
}
