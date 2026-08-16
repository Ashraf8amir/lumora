import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { AddressDto } from '../address.dto';
import { CreateUserBaseDto } from './create-user-base.dto';

export class CreateCustomerDto extends CreateUserBaseDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];
}
