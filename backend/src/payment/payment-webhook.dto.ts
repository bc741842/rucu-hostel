import { IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** What a bank / mobile-money provider sends when a student has paid. */
export class PaymentWebhookDto {
  @IsString()
  @MaxLength(64)
  controlNumber!: string;

  /** Amount received, in TZS. */
  @IsNumber()
  @Min(0)
  amount!: number;

  /** The provider's own unique transaction reference (used to ignore repeats). */
  @IsString()
  @MaxLength(128)
  reference!: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
