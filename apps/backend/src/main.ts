import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { assertProductionEnv } from './bootstrap-env';
import { resolveCorsOrigin } from './cors-origin';

async function bootstrap() {
  assertProductionEnv();

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const corsOrigin = resolveCorsOrigin();
  const origins = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
