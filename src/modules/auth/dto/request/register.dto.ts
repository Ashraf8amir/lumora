import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsString({ message: 'First name must be a valid string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @ApiProperty()
  @IsString({ message: 'Last name must be a valid string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  @Transform(({ value }: { value?: string }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty()
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(12, 128, { message: 'Password must be between 12 and 128 characters' })
  @IsStrongPassword()
  password!: string;
}
