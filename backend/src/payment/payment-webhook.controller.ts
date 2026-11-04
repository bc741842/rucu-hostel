import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentService } from './payment.service';
import { PaymentWebhookDto } from './payment-webhook.dto';

/**
 * Called by a payment provider (bank, mobile-money aggregator) - NOT by the
 * browser, so there is no login. It is protected by a shared secret: the
 * provider signs the raw request body with HMAC-SHA256 and sends the hex
 * digest in the `x-signature` header.
 */
@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: any,
    @Headers('x-signature') signature: string | undefined,
    @Body() dto: PaymentWebhookDto,
  ) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Automatic payments are not configured.');
    }
    const raw: Buffer | undefined = req.rawBody;
    if (!raw || !signature) throw new UnauthorizedException('Missing signature.');

    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const given = Buffer.from(signature.trim().toLowerCase(), 'utf8');
    const want = Buffer.from(expected, 'utf8');
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      throw new UnauthorizedException('Invalid signature.');
    }

    return this.paymentService.confirmFromGateway(dto);
  }
}
