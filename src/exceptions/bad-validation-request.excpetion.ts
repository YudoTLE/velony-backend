import { BadRequestException } from '@nestjs/common';

export interface Validation {
  field: string;
  message: string;
  children?: Validation[];
}

export class BadValidationRequest extends BadRequestException {
  constructor(details: Validation[]) {
    super({
      message: 'Validation error',
      error: 'Bad Request',
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      details,
    });
  }
}
