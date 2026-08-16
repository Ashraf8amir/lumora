import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CreateUserBaseDto } from './create-user-base.dto';

export class CreateStoreManagerDto extends CreateUserBaseDto {
  @IsMongoId()
  managedStoreId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
