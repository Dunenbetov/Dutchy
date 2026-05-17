import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { assertProductionEnv } from './bootstrap-env';
import { resolveCorsOrigin } from './cors-origin';
import { isMonolithDeploy } from './static-dir';

async function bootstrap() {
  assertProductionEnv();

  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api', {
    exclude: isMonolithDeploy()
      ? []
      : [{ path: '/', method: RequestMethod.GET }],
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

  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  await app.listen(port, host);

  console.log(
    `[dutchy] Listening on http://${host}:${port} | health=/api/health | spa=${isMonolithDeploy()}`,
  );
}

bootstrap().catch((err) => {
  console.error('[dutchy] Startup failed:', err);
  process.exit(1);
});
