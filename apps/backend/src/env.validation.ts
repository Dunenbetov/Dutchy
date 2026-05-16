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

/** Merge Railway / shell env — Nest validate() only receives .env keys by default. */
function loadEnv(config: Record<string, unknown>): Record<string, unknown> {
  return {
    ...config,
    NODE_ENV: process.env.NODE_ENV ?? config['NODE_ENV'],
    PORT: process.env.PORT ?? config['PORT'],
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? config['CORS_ORIGIN'],
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? config['OPENAI_API_KEY'],
  };
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, loadEnv(config), {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validated.NODE_ENV === Environment.Production) {
    const cors =
      validated.CORS_ORIGIN?.trim() ||
      process.env.CORS_ORIGIN?.trim() ||
      (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : '');
    if (!cors) {
      throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
    }
    validated.CORS_ORIGIN = cors;

    const openai =
      validated.OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!openai) {
      throw new Error('OPENAI_API_KEY must be set when NODE_ENV=production');
    }
    validated.OPENAI_API_KEY = openai;
  }

  return validated;
}
