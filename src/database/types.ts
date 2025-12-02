import Database from 'better-sqlite3'
import { getDatabasePath } from '../shared/utils/paths';

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  cacheSize?: number; // in KB, negative for KB, positive for pages
  tempStore?: 'default' | 'file' | 'memory';
  synchronous?: 'off' | 'normal' | 'full' | 'extra';
}

export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  path: getDatabasePath(),
  enableWAL: true,
  cacheSize: -64000, // 64MB
  tempStore: 'memory',
  synchronous: 'normal',
};

export type DatabaseError =
  | { type: 'not_found'; message: string }
  | { type: 'constraint_violation'; message: string }
  | { type: 'invalid_input'; message: string }
  | { type: 'database_error'; message: string; originalError?: unknown };

export type MetadataError =
  | { type: 'unsupported_mime'; message: string }
  | { type: 'insufficient_data'; message: string }
  | { type: 'metadata_error'; message: string; originalError?: unknown };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface BatchResult<T> {
  succeeded: T[];
  failed: Array<{
    item: unknown;
    error: DatabaseError;
  }>;
}

export type Database = Database.Database
