import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsString()
  label!: string;

  @IsString()
  city!: string;

  @IsString()
  street!: string;

  @IsString()
  buliding!: string;

  @IsString()
  apartment!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
