export class TwoFactorSetupResponseDto {
  secret!: string;
  qrCodeImageDataUrl!: string;

  constructor(partial: Partial<TwoFactorSetupResponseDto>) {
    Object.assign(this, partial);
  }
}
