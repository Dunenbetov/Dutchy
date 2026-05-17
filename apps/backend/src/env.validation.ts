import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { resolveCorsOrigin } from './cors-origin';
import { openAiKeyFromProcessEnv, readRuntimeEnv } from './runtime-env';
import { isMonolithDeploy } from './static-dir';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Transform(({ value }) => (value !== undefined ? Number(value) : 3000))
  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;
}

export function validate(config: Record<string, unknown> = {}) {
  // Nest passes vars from envFilePath in `config`; on Railway they are already in process.env.
  const runtime = readRuntimeEnv();
  const validated = plainToInstance(
    EnvironmentVariables,
    {
      NODE_ENV: config.NODE_ENV ?? runtime.NODE_ENV,
      PORT: config.PORT ?? runtime.PORT,
      CORS_ORIGIN: config.CORS_ORIGIN ?? runtime.CORS_ORIGIN,
      OPENAI_API_KEY: config.OPENAI_API_KEY ?? runtime.OPENAI_API_KEY,
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validated.NODE_ENV === Environment.Production) {
    const cors = resolveCorsOrigin() || validated.CORS_ORIGIN?.trim() || '';
    const monolith =
      isMonolithDeploy() || Boolean(process.env.STATIC_DIR?.trim());
    if (!cors && !monolith) {
      throw new Error(
        'CORS_ORIGIN or FRONTEND_URL must be set when NODE_ENV=production',
      );
    }
    if (cors) validated.CORS_ORIGIN = cors;

    const openai = openAiKeyFromProcessEnv() || validated.OPENAI_API_KEY?.trim();
    if (!openai) {
      throw new Error(
        'OPENAI_API_KEY must be set when NODE_ENV=production (read from process.env)',
      );
    }
    validated.OPENAI_API_KEY = openai;
  }

  return validated;
}
