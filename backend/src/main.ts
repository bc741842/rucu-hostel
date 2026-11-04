import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
 
async function bootstrap() {
  // rawBody: the payment webhook must verify a signature over the exact bytes sent.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  // Allow a full RUCU student list (CSV text) to be uploaded in one request.
  app.useBodyParser('json', { limit: '5mb' });
 
  // Ruhusu frontend (Next.js, port tofauti) kuongea na backend hii.
  // Anwani ya frontend yako ya kwenye hosting (Netlify).
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'https://boisterous-stroopwafel-bccf8e.netlify.app',
    ],
    credentials: true,
  });
 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
 
  // Picha/audio/video/faili za Chat na Announcements sasa zinahifadhiwa
  // Cloudinary (huduma ya nje ya bure), si kwenye diski ya server tena -
  // hivyo hazipotei kila backend inapo-restart kwenye hosting ya bure.
 
  // Hosting nyingi za bure (mfano Render) zinatoa namba ya PORT kupitia
  // mazingira (environment variable) - tunaitumia ikiwepo, vinginevyo
  // tunatumia 3000 kama kwenye computer yako.
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
 