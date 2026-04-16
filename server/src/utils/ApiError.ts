export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && Object.keys(this.details).length ? { details: this.details } : {}),
    };
  }
}
