import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/common/enums/role.enum';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty({ required: false })
  avatarUrl?: string;
}
