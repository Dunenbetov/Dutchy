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

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (validated.NODE_ENV === Environment.Production) {
    if (!validated.CORS_ORIGIN?.trim()) {
      throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
    }
    if (!validated.OPENAI_API_KEY?.trim()) {
      throw new Error('OPENAI_API_KEY must be set when NODE_ENV=production');
    }
  }

  return validated;
}
