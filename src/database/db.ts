import Database from 'better-sqlite3';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { DEFAULT_DB_CONFIG, type DatabaseConfig, type DatabaseError } from './types';
import { Ok, Err, type Result} from "../shared/types.ts";
import { initializeSchema, configurePragmas } from './schema';

type DatabaseInstance = Database.Database;

let dbInstance: DatabaseInstance | null = null;

function expandPath(path: string): string {
  if (path.startsWith('~/') || path === '~') {
    return join(homedir(), path.slice(2));
  }
  return path;
}

function ensureDirectoryExists(filePath: string): Result<void, DatabaseError> {
  try {
    const dir = join(filePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to create database directory',
      originalError: error,
    });
  }
}

/**
 * Initialize database connection with schema and configuration
 */
export function initializeDatabase(
  config: Partial<DatabaseConfig> = {}
): Result<DatabaseInstance, DatabaseError> {
  try {
    const fullConfig = { ...DEFAULT_DB_CONFIG, ...config };
    const dbPath = expandPath(fullConfig.path);

    const dirResult = ensureDirectoryExists(dbPath);
    if (!dirResult.ok) {
      return Err(dirResult.error);
    }

    // Create database connection
    const db = new Database(dbPath);

    // Configure pragmas
    const pragmaResult = configurePragmas(db, {
      enableWAL: fullConfig.enableWAL,
      cacheSize: fullConfig.cacheSize,
      tempStore: fullConfig.tempStore,
      synchronous: fullConfig.synchronous,
    });

    if (!pragmaResult.ok) {
      db.close();
      return Err(pragmaResult.error);
    }

    // Initialize schema
    const schemaResult = initializeSchema(db);
    if (!schemaResult.ok) {
      db.close();
      return Err(schemaResult.error);
    }

    // Store instance for getDatabase()
    dbInstance = db;

    return Ok(db);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to initialize database',
      originalError: error,
    });
  }
}

/**
 * Get existing database instance or throw error
 * Use this after calling initializeDatabase()
 */
export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): Result<void, DatabaseError> {
  try {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    return Ok(undefined);
  } catch (error) {
    return Err({
      type: 'database_error' as const,
      message: 'Failed to close database',
      originalError: error,
    });
  }
}

/**
 * Execute function within a transaction
 * Automatically rolls back on error
 */
export function withTransaction<T>(
  db: DatabaseInstance,
  fn: () => Result<T, DatabaseError>
): Result<T, DatabaseError> {
  try {
    db.exec('BEGIN TRANSACTION');

    const result = fn();

    if (result.ok) {
      db.exec('COMMIT');
      return result;
    } else {
      db.exec('ROLLBACK');
      return result;
    }
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    return Err({
      type: 'database_error' as const,
      message: 'Transaction failed',
      originalError: error,
    });
  }
}

export function databaseExists(path: string = DEFAULT_DB_CONFIG.path): boolean {
  const dbPath = expandPath(path);
  return existsSync(dbPath);
}
