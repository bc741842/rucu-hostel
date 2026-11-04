import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
 
@Module({
  imports: [NotificationsModule, AuditLogModule],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService],
})
export class PaymentModule {}
 