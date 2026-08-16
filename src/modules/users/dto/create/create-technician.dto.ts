import { IsArray, IsString } from 'class-validator';
import { CreateUserBaseDto } from './create-user-base.dto';

export class CreateTechnicianDto extends CreateUserBaseDto {
  @IsArray()
  @IsString({ each: true })
  skills!: string[];
}
