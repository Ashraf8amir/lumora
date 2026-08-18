import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateUserBaseDto } from './create-user-base.dto';
import { ApiProperty } from '@nestjs/swagger';

class PointLocationDto {
  @IsEnum(['Point'])
  @ApiProperty()
  type!: 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @ApiProperty({
    type: [Number],
  })
  coordinates!: [number, number];
}

export class AddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty()
  label!: string;

  @IsString()
  @MaxLength(100)
  @ApiProperty()
  city!: string;

  @IsString()
  @MaxLength(200)
  @ApiProperty()
  street!: string;

  @IsString()
  @MaxLength(20)
  @ApiProperty()
  building!: string;

  @IsString()
  @MaxLength(20)
  @ApiProperty()
  apartment!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty()
  floor?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PointLocationDto)
  @ApiProperty({
    type: PointLocationDto,
    description: 'Geographical location of the address',
  })
  location?: PointLocationDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty()
  note?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  isDefault?: boolean;
}

export class CreateCustomerDto extends CreateUserBaseDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @ApiProperty({
    type: [AddressDto],
    description: 'List of customer addresses',
  })
  addresses?: AddressDto[];
}
