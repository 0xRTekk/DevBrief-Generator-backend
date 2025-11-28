import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LevelOption, TechFocusOption } from '../../domain/value-objects/brief-generation-options';

export class GenerateBriefsDto {
  @IsEnum(LevelOption)
  level!: LevelOption;

  @IsNotEmpty()
  @IsString()
  domain!: string;

  @IsEnum(TechFocusOption)
  tech_focus!: TechFocusOption;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  stack!: string[];

  @IsNotEmpty()
  @IsString()
  duration!: string;

  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(10)
  count = 1;
}
