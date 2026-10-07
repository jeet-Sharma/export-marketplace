import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

// class-validator reports nested DTOs (e.g. CreateProductDto.priceTiers[0])
// as a tree of ValidationError nodes, each with its own `children`. This
// flattens that tree into dotted/indexed field paths — e.g.
// "priceTiers.0.minQuantity" — so the error envelope's `errors[].field`
// is still useful for nested validation failures, not just top-level ones.
function flattenValidationErrors(errors: ValidationError[], parentPath = ''): Array<{ field: string; message: string }> {
  const result: Array<{ field: string; message: string }> = [];

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push({ field: path, message });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, path));
    }
  }

  return result;
}

// Custom exceptionFactory for the global ValidationPipe (see main.ts).
// Nest's default factory collapses ValidationError[] into a flat
// string[] of formatted messages, which discards which field each
// message belongs to — the resulting error envelope's `errors[].field`
// could then only ever say "unknown". Building the structured
// {code, message, errors} body directly here, from the real
// ValidationError tree, means HttpExceptionFilter's existing
// "already-structured body" passthrough branch (see
// isStructuredBody/toEnvelope) handles it correctly with no filter
// changes needed, and `errors[].field` matches the API spec section 13
// example (`{"field": "moq", "message": "..."}`) instead of a placeholder.
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    errors: flattenValidationErrors(errors),
  });
}
