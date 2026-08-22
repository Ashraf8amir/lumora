import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 10)
  code!: string;

  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}
