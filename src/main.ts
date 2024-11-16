import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // This will ensure that any non-declared properties in the DTO will also cause an error
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Microservice')
    .setDescription(' API description')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  //CROS policy
  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from your frontend's origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    allowedHeaders: 'Content-Type, Accept', // Allowed headers
    credentials: true, // Allow credentials (cookies)
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log('Port----', port);
}
bootstrap();
