import { PartialType } from '@nestjs/swagger';
import { CreateUserBaseDto } from './create/create-user-base.dto';

export class UpdateUserDto extends PartialType(CreateUserBaseDto) {}
