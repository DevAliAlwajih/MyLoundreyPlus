import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global Exception Filter — يجب أن يكون قبل ValidationPipe
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // CORS
  app.enableCors({ origin: '*' });

  // ✅ Global prefix — كل الـ routes تبدأ بـ /api/v1
  app.setGlobalPrefix('api/v1');

  // إعداد Swagger
  const config = new DocumentBuilder()
    .setTitle('MyLoundreyPlus API')
    .setDescription('The MyLoundreyPlus API documentation and testing UI')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`📄 Swagger Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
