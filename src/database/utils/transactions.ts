/**
 * Transaction utility helpers
 */

import type { Database } from '../types';
import type { Result, DatabaseError } from '../../shared/types';
import { Ok, Err } from '../../shared/types';

/**
 * Execute multiple operations in a transaction with automatic rollback
 */
export function executeInTransaction<T>(
  db: Database,
  operations: () => Result<T>
): Result<T> {
  try {
    db.run('BEGIN TRANSACTION');

    const result = operations();

    if (result.ok) {
      db.run('COMMIT');
      return result;
    } else {
      db.run('ROLLBACK');
      return result;
    }
  } catch (error) {
    try {
      db.run('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    return Err({
      type: 'database_error' as const,
      message: 'Transaction failed unexpectedly',
      originalError: error,
    });
  }
}

/**
 * Execute operations with savepoint for nested transactions
 */
export function executeWithSavepoint<T>(
  db: Database,
  savepointName: string,
  operations: () => Result<T>
): Result<T> {
  try {
    db.run(`SAVEPOINT ${savepointName}`);

    const result = operations();

    if (result.ok) {
      db.run(`RELEASE SAVEPOINT ${savepointName}`);
      return result;
    } else {
      db.run(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      return result;
    }
  } catch (error) {
    try {
      db.run(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    } catch {
      // Ignore rollback errors
    }

    return Err({
      type: 'database_error' as const,
      message: `Savepoint ${savepointName} operation failed`,
      originalError: error,
    });
  }
}