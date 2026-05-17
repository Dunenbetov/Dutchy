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

export function validate(_config: Record<string, unknown> = {}) {
  const validated = plainToInstance(EnvironmentVariables, readRuntimeEnv(), {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validated.NODE_ENV === Environment.Production) {
    const cors = resolveCorsOrigin() || validated.CORS_ORIGIN?.trim() || '';
    if (!cors) {
      throw new Error(
        'CORS_ORIGIN or FRONTEND_URL must be set when NODE_ENV=production',
      );
    }
    validated.CORS_ORIGIN = cors;

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
