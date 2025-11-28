import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum LevelOption {
  Junior = 'junior',
  Intermediate = 'intermediate',
  Senior = 'senior',
}

enum TechFocusOption {
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
}

class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  OPENAI_API_KEY!: string;

  @IsOptional()
  @IsString()
  TARGET_MODEL?: string;

  @IsOptional()
  @IsString()
  SUPABASE_PROJECT_URL?: string;

  @IsOptional()
  @IsString()
  SUPABASE_ANON_KEY?: string;

  @IsOptional()
  @IsString()
  OUTPUT_DIR?: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsNumber()
  OPENAI_TEMPERATURE?: number;

  @IsOptional()
  @IsEnum(LevelOption)
  DEFAULT_LEVEL?: LevelOption;

  @IsOptional()
  @IsEnum(TechFocusOption)
  DEFAULT_TECH_FOCUS?: TechFocusOption;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
