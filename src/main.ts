import {
  ValidationPipe,
  HttpException,
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { BadValidationRequest } from './exceptions/bad-validation-request.excpetion';

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
        const dfs = (nodes) => {
          return nodes.map((node) => {
            return {
              field: node.property,
              ...(node.constraints
                ? { messages: Object.values(node.constraints) }
                : {}),
              ...(node.children && node.children.length > 0
                ? { children: dfs(node.children) }
                : {}),
            };
          });
        };

        return new BadValidationRequest(dfs(errors));
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT')!;
  await app.listen(port);
}

bootstrap();
