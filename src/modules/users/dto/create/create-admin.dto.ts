import { CreateUserBaseDto } from './create-user-base.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AccessLevel } from '../../enums/access-level.enum';

export class CreateAdminDto extends CreateUserBaseDto {
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;
}
