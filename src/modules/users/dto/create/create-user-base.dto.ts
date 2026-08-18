import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsDate,
} from 'class-validator';

export class CreateUserBaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty()
  lastName!: string;

  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsOptional()
  @IsPhoneNumber('EG')
  @ApiProperty()
  phone?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiProperty()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty()
  gender?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  avatarUrl?: string;
}
