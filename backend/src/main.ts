import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // CORS
  app.enableCors();

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 MyLoundreyPlus Backend is running on: http://localhost:${port}`);
}
bootstrap();
