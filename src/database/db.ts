import BetterSqlite3 from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { DEFAULT_DB_CONFIG, type DatabaseConfig, type DatabaseError, type Database } from './types';
import { Ok, Err, type Result} from "../shared/types";
import { initializeSchema, configurePragmas } from './schema';
import { expandPath, ensureParentDirectoryExists } from '../shared/utils';

let dbInstance: Database | null = null;

/**
 * Initialize database connection with schema and configuration
 */
export function initializeDatabase(
  config: Partial<DatabaseConfig> = {}
): Result<Database, DatabaseError> {
  try {
    const fullConfig = { ...DEFAULT_DB_CONFIG, ...config };
    const dbPath = expandPath(fullConfig.path);

    const dirResult = ensureParentDirectoryExists(dbPath);
    if (!dirResult.ok) {
      return Err({
        type: 'database_error' as const,
        message: 'Failed to create database directory',
      });
    }

    // Create database connection
    const db = new BetterSqlite3(dbPath);

    // Configure pragmas
    const pragmaResult = configurePragmas(db, {
      enableWAL: fullConfig.enableWAL,
      cacheSize: fullConfig.cacheSize,
      tempStore: fullConfig.tempStore,
      synchronous: fullConfig.synchronous,
    });

    if (!pragmaResult.ok) {
      db.close();
      return pragmaResult as Result<Database, DatabaseError>;
    }

    // Initialize schema
    const schemaResult = initializeSchema(db);
    if (!schemaResult.ok) {
      db.close();
      return schemaResult as Result<Database, DatabaseError>;
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
export function getDatabase(): Database {
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
  db: Database,
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
