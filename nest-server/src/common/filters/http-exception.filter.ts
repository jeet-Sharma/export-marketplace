import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface FieldError {
  field: string;
  message: string;
}

interface ErrorEnvelope {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
}

// Normalizes every thrown error into the consistent envelope from
// Phase-1-API-Specification-v0.1 section 13:
// { statusCode, code, message, errors?, timestamp }.
//
// Three shapes of HttpException are handled:
// 1. Already-structured ones thrown deliberately with a {code, message,
//    errors} body — this is what both ProductsService's manual checks
//    (assertPublishable/assertPriceTiersDoNotOverlap) AND the global
//    ValidationPipe's custom exceptionFactory (see
//    validation-exception-factory.ts) now produce, so DTO validation
//    failures get real `errors[].field` values, not a placeholder.
// 2. Nest's *default* ValidationPipe shape — { message: string[] } with
//    no field info — handled only as a defensive fallback in case some
//    route-level pipe doesn't use the global exceptionFactory; the
//    primary path (1) above should always apply in practice.
// 3. Plain built-in exceptions (NotFoundException, UnauthorizedException,
//    etc. thrown with just a string) — given a derived `code` from the
//    HTTP status and the string becomes `message`.
// Unhandled (non-HttpException) errors become a generic 500 — the
// underlying error is logged server-side but never leaked to the client
// (API spec section 15: "without leaking internal details").
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(this.toEnvelope(status, body));
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      this.toEnvelope(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error'),
    );
  }

  private toEnvelope(status: number, body: unknown): ErrorEnvelope {
    const timestamp = new Date().toISOString();

    // Already-structured body: { code, message, errors } — pass through,
    // filling in statusCode/timestamp.
    if (this.isStructuredBody(body)) {
      return {
        statusCode: status,
        code: body.code,
        message: body.message,
        errors: body.errors,
        timestamp,
      };
    }

    // class-validator / ValidationPipe shape: { message: string[], ... }.
    if (this.isValidationPipeBody(body)) {
      return {
        statusCode: status,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors: body.message.map((message) => ({ field: 'unknown', message })),
        timestamp,
      };
    }

    // Plain string or { message: string } body from a built-in exception.
    const message = typeof body === 'string' ? body : this.extractMessage(body);
    return {
      statusCode: status,
      code: this.codeForStatus(status),
      message,
      timestamp,
    };
  }

  private isStructuredBody(
    body: unknown,
  ): body is { code: string; message: string; errors?: FieldError[] } {
    return (
      typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      'message' in body &&
      typeof (body as Record<string, unknown>).code === 'string' &&
      typeof (body as Record<string, unknown>).message === 'string'
    );
  }

  private isValidationPipeBody(body: unknown): body is { message: string[] } {
    return (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      Array.isArray((body as Record<string, unknown>).message)
    );
  }

  private extractMessage(body: unknown): string {
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as Record<string, unknown>).message === 'string'
    ) {
      return (body as Record<string, string>).message;
    }
    return 'An error occurred';
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
