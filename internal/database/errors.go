package database

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound            = errors.New("not found")
	ErrConstraintViolation = errors.New("constraint violation")
	ErrInvalidInput        = errors.New("invalid input")
	ErrTransactionFailed   = errors.New("transaction failed")
)

var (
	errQueryFailed        = "failed to query %s"
	errScanFailed         = "failed to scan %s row"
	errIterationFailed    = "error iterating %s rows"
	errExecFailed         = "failed to execute %s"
	errCreateFailed       = "failed to create %s"
	errUpdateFailed       = "failed to update %s"
	errDeleteFailed       = "failed to delete %s"
	errGetByIDFailed      = "failed to get %s by ID"
	errGetByNameFailed    = "failed to get %s by name"
	errSearchFailed       = "failed to search %s"
	errLastInsertIDFailed = "failed to get last insert ID"
	errRowsAffectedFailed = "failed to get rows affected"
	errTransactionBegin   = "failed to begin transaction"
	errTransactionCommit  = "failed to commit transaction"
)

func WrapQueryError(entity string, err error) error {
	return fmt.Errorf(errQueryFailed+": %w", entity, err)
}

func WrapScanError(entity string, err error) error {
	return fmt.Errorf(errScanFailed+": %w", entity, err)
}

func WrapIterationError(entity string, err error) error {
	return fmt.Errorf(errIterationFailed+": %w", entity, err)
}

func WrapExecError(operation string, err error) error {
	return fmt.Errorf(errExecFailed+": %w", operation, err)
}

func WrapCreateError(entity string, err error) error {
	return fmt.Errorf(errCreateFailed+": %w", entity, err)
}

func WrapUpdateError(entity string, err error) error {
	return fmt.Errorf(errUpdateFailed+": %w", entity, err)
}

func WrapDeleteError(entity string, err error) error {
	return fmt.Errorf(errDeleteFailed+": %w", entity, err)
}

func WrapGetByIDError(entity string, err error) error {
	return fmt.Errorf(errGetByIDFailed+": %w", entity, err)
}

func WrapGetByNameError(entity string, err error) error {
	return fmt.Errorf(errGetByNameFailed+": %w", entity, err)
}

func WrapSearchError(entity string, err error) error {
	return fmt.Errorf(errSearchFailed+": %w", entity, err)
}

func WrapLastInsertIDError(err error) error {
	return fmt.Errorf(errLastInsertIDFailed+": %w", err)
}

func WrapRowsAffectedError(err error) error {
	return fmt.Errorf(errRowsAffectedFailed+": %w", err)
}

func WrapTransactionBeginError(err error) error {
	return fmt.Errorf(errTransactionBegin+": %w", err)
}

func WrapTransactionCommitError(err error) error {
	return fmt.Errorf(errTransactionCommit+": %w", err)
}
