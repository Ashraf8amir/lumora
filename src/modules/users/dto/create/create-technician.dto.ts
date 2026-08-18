import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ArrayUnique,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserBaseDto } from './create-user-base.dto';

export class TechnicianProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}

export class CreateTechnicianDto extends CreateUserBaseDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TechnicianProfileDto)
  profile?: TechnicianProfileDto;
}
