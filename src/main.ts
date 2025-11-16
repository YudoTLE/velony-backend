import {
  ValidationPipe,
  BadRequestException,
  HttpException,
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

@Catch()
class GlobalExceptionHandler implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // eslint-disable-next-line no-console
    console.error(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json(res);
    }

    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new GlobalExceptionHandler());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const formatted: Record<string, string[]> = {};

        for (const err of errors) {
          const messages = Object.values(err.constraints ?? {});

          if (!formatted[err.property]) {
            formatted[err.property] = [];
          }

          formatted[err.property].push(...messages);
        }

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation error',
          error: 'Bad Request',
          errors: formatted,
        });
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT')!;
  await app.listen(port);
}

bootstrap();
