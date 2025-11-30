import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Ok, Err, type Result } from './../../shared/types'

export async function calculateFileMD5(filePath: string): Promise<Result<string, any>> {
  try {
    const buffer = await readFile(filePath);
    const hash = createHash('md5');
    hash.update(buffer);
    return Ok(hash.digest('hex'));
  } catch (error) {
    return Err(error);
  }
}

export function calculateBufferMD5(buffer: ArrayBuffer): string {
  const hash = createHash('md5');
  hash.update(new Uint8Array(buffer));
  return hash.digest('hex');
}
